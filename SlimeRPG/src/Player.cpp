/* SlimeRPG - Player.cpp */
#include "Player.h"
#include <cmath>
#include <algorithm>

Player::Player(float x, float y)
    : m_name("アース")
    , m_x(x)
    , m_y(y)
    , m_vx(0.0f)
    , m_vy(0.0f)
    , m_width(24.0f)
    , m_height(20.0f)
    , m_hp(50)
    , m_maxHp(50)
    , m_mp(20)
    , m_maxMp(20)
    , m_speedWalk(2.2f)
    , m_speedRun(4.2f)
    , m_facing(FacingDirection::DOWN)
    , m_squishX(1.0f)
    , m_squishY(1.0f)
    , m_animTimer(0.0f)
    , m_actionPulse(0.0f)
{
}

void Player::update(float dx, float dy, bool isRunning, bool spacePressed) {
    float speed = isRunning ? m_speedRun : m_speedWalk;

    m_vx = dx * speed;
    m_vy = dy * speed;

    m_x += m_vx;
    m_y += m_vy;

    // 向き判定
    if (std::abs(dx) > std::abs(dy)) {
        m_facing = (dx > 0.0f) ? FacingDirection::RIGHT : FacingDirection::LEFT;
    } else if (std::abs(dy) > 0.0f) {
        m_facing = (dy > 0.0f) ? FacingDirection::DOWN : FacingDirection::UP;
    }

    // ぷにぷにアニメーション計算
    bool isMoving = (std::abs(m_vx) > 0.001f || std::abs(m_vy) > 0.001f);
    m_animTimer += isMoving ? 0.15f : 0.05f;

    if (isMoving) {
        float factor = isRunning ? 0.25f : 0.12f;
        m_squishX = 1.0f + std::sin(m_animTimer * 2.0f) * factor;
        m_squishY = 1.0f - std::sin(m_animTimer * 2.0f) * factor;
    } else {
        m_squishX = 1.0f + std::sin(m_animTimer) * 0.05f;
        m_squishY = 1.0f - std::sin(m_animTimer) * 0.05f;
    }

    // Spaceキーアクション (躍動)
    if (spacePressed) {
        m_actionPulse = 1.0f;
    }

    if (m_actionPulse > 0.0f) {
        m_actionPulse -= 0.08f;
        if (m_actionPulse < 0.0f) m_actionPulse = 0.0f;
    }
}

void Player::healHp(int amount) {
    m_hp = std::min(m_maxHp, m_hp + amount);
}

void Player::useMp(int amount) {
    m_mp = std::max(0, m_mp - amount);
}
