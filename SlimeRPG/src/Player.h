/* SlimeRPG - Player.h */
#ifndef PLAYER_H
#define PLAYER_H

#include <string>

enum class FacingDirection {
    DOWN,
    UP,
    LEFT,
    RIGHT
};

class Player {
public:
    Player(float x, float y);
    ~Player() = default;

    void update(float dx, float dy, bool isRunning, bool spacePressed);
    
    // ゲッター
    float getX() const { return m_x; }
    float getY() const { return m_y; }
    float getVx() const { return m_vx; }
    float getVy() const { return m_vy; }
    int getHp() const { return m_hp; }
    int getMaxHp() const { return m_maxHp; }
    int getMp() const { return m_mp; }
    int getMaxMp() const { return m_maxMp; }
    FacingDirection getFacing() const { return m_facing; }
    float getSquishX() const { return m_squishX; }
    float getSquishY() const { return m_squishY; }

    // セッター
    void setPosition(float x, float y) { m_x = x; m_y = y; }
    void healHp(int amount);
    void useMp(int amount);

private:
    std::string m_name;
    float m_x;
    float m_y;
    float m_vx;
    float m_vy;
    float m_width;
    float m_height;

    int m_hp;
    int m_maxHp;
    int m_mp;
    int m_maxMp;

    float m_speedWalk;
    float m_speedRun;

    FacingDirection m_facing;
    float m_squishX;
    float m_squishY;
    float m_animTimer;
    float m_actionPulse;
};

#endif // PLAYER_H
