/* SlimeRPG - Game.cpp */
#include "Game.h"
#include <iostream>

Game::Game()
    : m_isRunning(true)
    , m_player(640.0f, 640.0f)
{
}

void Game::initialize() {
    std::cout << "[Game] Initializing Earth Slime world, tiles and player..." << std::endl;
}

void Game::update(float deltaTime) {
    // 物理とロジックの更新
    m_player.update(0.0f, 0.0f, false, false);
}

void Game::render() {
    // レンダリング処理
}
