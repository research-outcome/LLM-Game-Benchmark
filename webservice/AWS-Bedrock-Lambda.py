import json
import boto3
from botocore.exceptions import ClientError

accept = 'application/json'
contentType = 'application/json'
secretToCheck = 'YOUR-SECRET-WORD'

brt = boto3.client('bedrock-runtime')

def lambda_handler(event, context):

    print("event: ", event)
    secret = event['secret']
    # If secret is not correct, do not do anything
    if (secret != secretToCheck):
        return {'statusCode':200,'body': 'unauthorized access'}
        
    prompt = event['prompt']
    modelId = event['modelId']
    modelType = event['type']

    imageBase64 = ""
    
    #If no image parameter exists, expected error: [ERROR] KeyError: 'image'
    try:
        imageBase64 = event['image']
    except Exception:
        pass
    
    print("prompt: ", prompt )
    print("modelId: ", modelId )
    print("type: ", modelType )
    print("image: ", imageBase64 )
    
    body = " "
    
    if (modelType == 'anthropic'): 
        #The following is for Claude2 and Cloude2.1. Note that if modelid name changes the following might not work
        if 'claude-v2' in modelId:
            prompt = "Human: " + prompt + " \n\nAssistant:"
            body = json.dumps({
                "prompt": prompt,
                "max_tokens_to_sample": 512
                })
        else: #the following is Claude3 that uses Message API
            if len(imageBase64) > 1:
                body = json.dumps({
                        "anthropic_version": "bedrock-2023-05-31", #BE AWARE that anthropic_version might need to be updated later
                        "max_tokens": 4096, #BE AWARE if the text is too long this might need to be updated
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image",
                                        "source": {
                                            "type": "base64",
                                            "media_type": "image/png",
                                            "data": imageBase64,
                                        },
                                    },
                                    {"type": "text", "text": prompt}
                                    ],
                            }
                            ],
                    })
            else:
                body = json.dumps({
                        "anthropic_version": "bedrock-2023-05-31", #BE AWARE that anthropic_version might need to be updated later
                        "max_tokens": 512, #BE AWARE if the text is too long this might need to be updated
                        "messages": [
                            {
                                "role": "user",
                                "content": [{"type": "text", "text": prompt}],
                            }
                            ],
                        
                    })

    # Currently, amazon LLMs do not work with this code.
    if (modelType == 'amazon'):
        body = json.dumps({
            "inputText": prompt
            })

    if (modelType == 'meta'):
        prompt = f"""<|begin_of_text|><|start_header_id|>user<|end_header_id|>
            {prompt}
            <|eot_id|><|start_header_id|>assistant<|end_header_id|>"""
        print("llama3prompt: ", prompt )
        body = json.dumps({
                "prompt": prompt
            })
        
    if (modelType == 'mistral'):
        prompt = prompt + " [INST] suggest your next move in a concise JSON format, such as {'row': 1, 'column': 3}, without any additional commentary. [/INST]"
        body = json.dumps({
            "prompt": prompt
            })

    if (modelType == 'ai21'):
        body = json.dumps({
            "prompt": prompt
            })

    print("body: ", body)
    
    response = brt.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    print("response: ", response)
    response_body = json.loads(response.get('body').read())
    print("response_body: ", response_body)
    response_text = ""

    if (modelType == 'ai21'):
        response_text = response_body.get('completions')[0].get('data').get('text')
        print("response_text: ", response_text)
       
    if (modelType == 'meta'):
        response_text = response_body.get('generation')
        print("response_text: ", response_text)
        
    if (modelType == 'mistral'):
        response_text = response_body.get('outputs')[0].get('text')
        print("response_text: ", response_text)

    if (modelType == 'amazon'):
        results = response_body.get('results')
        print("results: ", results)
        #response_text = response_body.get('results')[0].get('outputText') 
        #response_text = response_body.get('embedding')        
        #print("response_text: ", response_text)

    if (modelType == 'anthropic'):
        if 'claude-v2' in modelId:
            response_text = response_body.get('completion')
        else:
            response_text = response_body.get('content')[0].get('text')
            #input_tokens = response_body["usage"]["input_tokens"]
            #output_tokens = response_body["usage"]["output_tokens"]
            #output_list = response_body.get("content", [])

        print("response_text: ", response_text)
        

    return {
        'statusCode':200,
        'body': json.dumps(response_text)
    }
    
