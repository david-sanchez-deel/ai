# Colors for console
from colorama import init
init()

import gym
env = gym.make('FrozenLake-v0', is_slippery=False)

from model import Model
model = Model()

from memory import Memory
memory = Memory()

from game import Game
game = Game(memory, env, model)

# Get initial dataset
print("Play random")
for i in range(1000):
  game.play(random=True)
print("Train")
game.train()

print("Play normal")
wins = 0
games = 100
for i in range(games):
  if game.play():
    wins += 1
  game.train()
print("Win rate:", wins/games)
#memory.print()
#game.train(False)
#game.play(False, True)