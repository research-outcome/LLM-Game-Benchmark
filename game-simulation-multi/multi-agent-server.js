import { START, END, StateGraph } from "@langchain/langgraph";
import { asynchronousWebServiceCall } from "./web-service-communication.js";
import http from "http";

// Set hostname and port for the multi-agent implementation server.
const HOSTNAME = "localhost";
const PORT = 3000;

// Agent class, which contains the agent's name, as well as the corresponding model information.
// Although our implementation uses the same model for the strategist, suggester, and validator, this class makes it possible to have different models playing each role.
class Agent {
    constructor(agentName, modelType, modelName, modelUrl, modelApiKey) {
        this.agentName = agentName;
        this.modelType = modelType;
        this.modelName = modelName;
        this.modelUrl = modelUrl;
        this.modelApiKey = modelApiKey;
    }
}

// Run an agent node given the current graph state (messages list), prompt, system prompt, image data, and agent object.
async function runAgentNode(messages, prompt, systemPrompt, imageData, agent) {
    console.log("\nPrompt for " + agent.agentName + ": " + prompt + "\n");

    // Obtain LLM's response with the given prompt, image data (if any), and model information (taken from the agent object).
    let response = await asynchronousWebServiceCall(prompt, systemPrompt, imageData, agent.modelType, agent.modelName, agent.modelUrl, agent.modelApiKey, false);
    //let response = "{'row': 1, 'column': 1}"; // For testing.

    console.log(agent.agentName + "'s response: \"" + response + "\"" + "\n");

    messages.push(response);
}

// Run the suggester node by appending suggester-specific information to the prompt and then calling runAgentNode.
async function suggesterNode(messages, prompt, systemPrompt, imageData, suggesterAgent) {
    // Append strategic suggestions from the strategist to the prompt.
    prompt += (" The suggestions from your strategist are as follows: " + messages[0]);

    // If there is any feedback from the validator, it means that the suggester already made a move that the validator rejected.
    // Append the validator's most recent feedback to the prompt, if there is any.
    if (messages.length > 1) {
        prompt += " \\n Your previously suggested move was as follows: " + messages[messages.length - 2] + " \\n";
        prompt += " The validator did not choose to submit this move. Here is its feedback; please adjust accordingly: " + messages[messages.length - 1];
    }

    // Run the suggester agent with the updated prompt.
    await runAgentNode(messages, prompt, systemPrompt, imageData, suggesterAgent);
}

// Run the validator node by appending the suggester's move to the prompt and then calling runAgentNode.
async function validatorNode(messages, prompt, systemPrompt, imageData, validatorAgent) {
    // Obtain the suggester's most recent move and append it to the prompt.
    prompt += (" The move from the suggester is as follows: " + messages[messages.length - 1]);

    // Run the validator agent with the updated prompt.
    await runAgentNode(messages, prompt, systemPrompt, imageData, validatorAgent);
}

// Create a web server that will facilitate the multi-agent collaboration and return a properly-formatted move.
const server = http.createServer((req, res) => {
    // Set HTTP response headers.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;

    // If we have received a preflight request, it is not an actual request for a move. Simply return an empty response with an OK status code.
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    let requestBody = ""; // Initialize request body, which will store the HTTP request from the game simulation.

    // If we have received a POST request, it IS a request for a move. Obtain the request's content and perform multi-agent collaboration.
    if (req.method === "POST") {
        // Continually obtain the request's body in chunks.
        req.on("data", (chunk) => {
            requestBody += chunk;
        });

        // Once we have obtained the complete request body, perform multi-agent collaboration.
        req.on("end", async () => {
            console.log("\n---------------------------------------------------------------");
            requestBody = JSON.parse(requestBody);
            // console.log("Strategist Prompt: " + requestBody.strategistPrompt);
            // console.log("Suggester Prompt: " + requestBody.suggesterPrompt);
            // console.log("Validator Prompt: " + requestBody.validatorPrompt);
            // console.log("Model Type: " + requestBody.modelType);
            // console.log("Model Name: " + requestBody.modelName);
            // console.log("Model URL: " + requestBody.modelUrl);
            // console.log("Model API KEY: " + requestBody.modelApiKey);

            // Create agent objects for the strategist, suggester, and validator.
            const strategistAgent = new Agent("Strategist", requestBody.modelType, requestBody.modelName, requestBody.modelUrl, requestBody.modelApiKey);
            const suggesterAgent = new Agent("Suggester", requestBody.modelType, requestBody.modelName, requestBody.modelUrl, requestBody.modelApiKey);
            const validatorAgent = new Agent("Validator", requestBody.modelType, requestBody.modelName, requestBody.modelUrl, requestBody.modelApiKey);

            const agentStateChannels  = {
                messages: {
                    value: (x, y) => (x || []).concat(y || []),
                    default: () => [],
                },
                sender: {
                    value: (x, y) => y || x || "user",
                    default: () => "user",
                },
            };

            // Initialize a list of messages, which will be used as the graph's state. Each agent can access messages from this list, but we only access specific messages rather than pass the entire list as a prompt.
            let messages = [];

            // Initialize the graph object and add Strategist, Suggester, and Validator nodes to it.
            const workflow = new StateGraph({channels: agentStateChannels})
                .addNode("Strategist", async () => await runAgentNode(messages, requestBody.strategistPrompt, requestBody.systemPrompt, requestBody.imageData, strategistAgent))
                .addNode("Suggester", async () => await suggesterNode(messages, requestBody.suggesterPrompt, requestBody.systemPrompt, requestBody.imageData, suggesterAgent))
                .addNode("Validator", async () => await validatorNode(messages, requestBody.validatorPrompt, requestBody.systemPrompt, requestBody.imageData, validatorAgent))

            // Add edges to the graph. The graph will start at the strategist node, move to the suggester, move to the validator, and then either end or loop back to the suggester (if the validator found something wrong with the suggester's move).
            workflow.addEdge(START, "Strategist");
            workflow.addEdge("Strategist", "Suggester");
            workflow.addEdge("Suggester", "Validator");
            workflow.addConditionalEdges("Validator", () => { // Once we call the validator, check if its response contains "Finalize Move". If so, end the execution. If not, loop back to the suggester.
                return messages[messages.length - 1].includes("Finalize Move");
            }, {false: "Suggester", true: END});

            // Initialize the graph with the defined workflow.
            const graph = workflow.compile();

            // Attempt to obtain a response from the multi-agent collaboration.
            let jsonResponse;
            try {
                await graph.invoke(
                    {
                        messages: [requestBody.strategistPrompt],
                    },
                    { recursionLimit: 10 },
                );

                jsonResponse = {
                    response: messages[messages.length - 2],
                };
            }
            catch (error) {
                console.log(error);
                jsonResponse = {
                    response: "The agents couldn't come up with a move before reaching the graph's recursion limit."
                }
            }

            // Translate the response object into a string to be sent back to the game simulation.
            const responseBody = JSON.stringify(jsonResponse);

            console.log("Final Move Sent to Simulation: " + responseBody);

            // Send the response body
            res.end(responseBody);
        });
    }
});

// Start the multi-agent collaboration server.
server.listen(PORT, HOSTNAME, () => {
    console.log("Server running at http://" + HOSTNAME + ":" + PORT + "/");
});
