# LLM Game Benchmark
This repository is developed to evaluate Large Language Models (LLMs) via Game Playing. It includes the following components:
- A leaderboard to view and compare the results of previous games among LLMs. We **welcome submissions** to the leaderboard. To review the current status of the leaderboard, please see the leaderboard folder.
  
- An extensible game simulation software to test LLMs via games such as Tic-Tac-Toe, Connect Four, and Gomoku. For more information and try out the game simulations, please see the game-simulation folder.
  
- The detailed output files of game runs to analyze the details of the games that are presented on the leaderboard. Please see the outputs folder.
  

This repository **welcomes contributions and suggestions**. The LLM Game Benchmark repository is shared under the MIT License.

| Tic-Tac-Toe  | Connect Four | Gomoku |
| ------------- | ------------- | ------------- |
| ![tictactoe](https://github.com/research-outcome/LLM-Game-Benchmark/assets/1295373/bceee748-f151-4854-a558-a07dde7ff6a3)  | ![connect4](https://github.com/research-outcome/LLM-Game-Benchmark/assets/1295373/42f19aca-7c54-4813-ae0d-58f21b233b5b)  | ![gomoku](https://github.com/research-outcome/LLM-Game-Benchmark/assets/129539668/dde5f13c-e881-443f-b744-f64334994f9d) |



**Game Simulation Webpage:**

To run simulations of Tic-Tac-Toe, Connect Four, and Gomoku games, please visit the game simulation page [here]. You can use your OpenAI API Key or Google Gemini API Key to run the simulations yourself. Below is a screenshot of the game simulation page. 
![LLM-GameSimulation-Connect4Run](https://github.com/research-outcome/LLM-Game-Benchmark/assets/129539668/1d300826-5298-48dd-85fd-afdf0b5be79c)


**Interactions with the LLMs:**

We have implemented the interaction between each game and the LLMs, as shown in the figure below. To interact with the LLMs hosted on AWS Bedrock, you can use the sample code provided in the webservice directory.
![App-Web-Interaction](https://github.com/research-outcome/LLM-Game-Benchmark/assets/136174718/6999c68e-3a94-442e-9978-53ae57153e41)


**Publication:**

We have published the details of this study. If you utilize the repository, please cite the publication:
- Coming soon to arXiv.org and a reputable publication venue.

If you have any questions, please contact research.explorations at gmail.
