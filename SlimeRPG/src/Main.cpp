/* SlimeRPG - Main.cpp */
#include <iostream>
#include "Game.h"

int main(int argc, char* argv[]) {
    std::cout << "========================================" << std::endl;
    std::cout << "   SLIME & RPG - 格下スライム「アース」" << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "[Info] C++ Core Game Engine initialized." << std::endl;

    Game game;
    game.initialize();

    // メインゲームループのシミュレーション
    int frameCount = 0;
    while (game.isRunning() && frameCount < 60) {
        game.update(0.016f); // 60FPS (16.6ms)
        game.render();
        frameCount++;
    }

    std::cout << "[Info] Game engine finished cleanly." << std::endl;
    return 0;
}
