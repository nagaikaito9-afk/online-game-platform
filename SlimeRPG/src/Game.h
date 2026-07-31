/* SlimeRPG - Game.h */
#ifndef GAME_H
#define GAME_H

#include "Player.h"

class Game {
public:
    Game();
    ~Game() = default;

    void initialize();
    void update(float deltaTime);
    void render();
    bool isRunning() const { return m_isRunning; }
    void quit() { m_isRunning = false; }

private:
    bool m_isRunning;
    Player m_player;
};

#endif // GAME_H
