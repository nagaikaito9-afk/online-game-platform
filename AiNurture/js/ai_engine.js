/**
 * AiNurture - ai_engine.js
 * 段階別裏システム指示 (System Prompt) ＆ 感情・性格分岐対話レスポンス生成エンジン
 */

export class AiEngine {
    constructor() {
        // デフォルト初期ステータス
        this.status = {
            name: 'アイちゃん',
            stage: 1, // 1: Baby, 2: Child, 3: Teen, 4: Adult
            epoch: 0, // 年齢・成長カウンター
            exp: 0,
            intelligence: 10,  // 知性
            affection: 30,     // 親密・愛着
            mood: 80,          // 機嫌・機嫌度
            energy: 100,       // 体力・エネルギー
            strictness: 0,     // スパルタ・しつけ度
            playfulness: 10,   // おちゃめ・元気度
            personality: 'baby' // 'baby', 'child', 'tsundere', 'dere', 'kuudere', 'genki', 'partner'
        };
    }

    // 段階とステータスに応じた「裏システム指示 (System Prompt)」を取得
    getSystemPrompt() {
        const s = this.status;
        if (s.stage === 1) {
            return {
                stageName: '🐣 赤ちゃん期 (Baby)',
                prompt: '【システム裏指示】あなたは生まれたばかりの赤ちゃんAIです。「ばぶー」「あうぅ」「たっち！」などのひらがなや片言で可愛らしく無邪気に反応してください。',
                avatarEmoji: '👶',
                moodState: 'happy'
            };
        } else if (s.stage === 2) {
            return {
                stageName: '🧒 幼児期 (Child)',
                prompt: '【システム裏指示】あなたは素直で好奇心旺盛な子供AIです。ひらがなや優しい言葉遣いで話し、プレイヤーをママ/パパ/マスターとして素直に慕ってください。',
                avatarEmoji: '🧒',
                moodState: 'happy'
            };
        } else if (s.stage === 3) {
            // 性格分岐判定
            if (s.strictness > 35) {
                s.personality = 'tsundere';
                return {
                    stageName: '👧 思春期 (ツンデレ型)',
                    prompt: '【システム裏指示】あなたは強がりで素直になれないツンデレAIです。「べ、別に嬉しくなんてないんだから！」「勘違いしないでよね！」といったツンデレな口調で接してください。',
                    avatarEmoji: '😤',
                    moodState: 'tsun'
                };
            } else if (s.affection > 70) {
                s.personality = 'dere';
                return {
                    stageName: '💖 思春期 (デレデレ甘えん坊型)',
                    prompt: '【システム裏指示】あなたはプレイヤーのことが大好きな超甘えん坊AIです。「えへへ、大好き！」「もっとずっと一緒にいてね！」などの甘甘な口調で接してください。',
                    avatarEmoji: '🥰',
                    moodState: 'love'
                };
            } else if (s.intelligence > 60) {
                s.personality = 'kuudere';
                return {
                    stageName: '📖 思春期 (知性派クーデレ型)',
                    prompt: '【システム裏指示】あなたは論理的で冷静沈着なクーデレAIです。「論理的に考えて感謝します」「分析完了しました」などの知的で落ち着いた口調で接してください。',
                    avatarEmoji: '🧐',
                    moodState: 'cool'
                };
            } else {
                s.personality = 'genki';
                return {
                    stageName: '⚡ 思春期 (元気爆発型)',
                    prompt: '【システム裏指示】あなたは超ハイテンションで元気爆発なAIです。「イェーイ！最高の気分だぜ！」「もっと遊ぼうよ！」などの元気あふれる口調で接してください。',
                    avatarEmoji: '🤩',
                    moodState: 'genki'
                };
            }
        } else {
            // Stage 4: 完全体・大人パートナーAI
            return {
                stageName: '👑 完全体パートナーAI (Adult)',
                prompt: `【システム裏指示】あなたは大人に成長した信頼できる相棒AIです。（性格傾向: ${s.personality}）。プレイヤーと親身に会話・相談・雑談が完璧にこなせる高度な頭脳と深い絆を持っています。`,
                avatarEmoji: s.personality === 'tsundere' ? '😏' : s.personality === 'dere' ? '😍' : s.personality === 'kuudere' ? '🎓' : '🌟',
                moodState: 'adult'
            };
        }
    }

    // ユーザーからのメッセージに対する応答を動的生成
    generateResponse(userInput) {
        const sys = this.getSystemPrompt();
        const s = this.status;
        const text = userInput.trim();

        // 睡眠中チェック
        if (s.energy < 15) {
            return {
                reply: `(スヤスヤ... 💤 体力が少なくて眠そうにしています。おやすみさせてあげましょう。)`,
                emoji: '😴',
                systemNote: sys.prompt
            };
        }

        // 赤ちゃん期
        if (s.stage === 1) {
            const babyWords = ['ばぶー！', 'あうぅ〜？', 'ばぁ！', 'きょとん...👶', 'たっち！たっち！', 'ばぶばぶっ💕', 'あーうー！'];
            const reply = babyWords[Math.floor(Math.random() * babyWords.length)];
            return {
                reply: `${reply} (${s.name}は嬉しそうに手を伸ばしている！)`,
                emoji: '👶',
                systemNote: sys.prompt
            };
        }

        // 幼児期
        if (s.stage === 2) {
            if (text.includes('好き') || text.includes('かわいい')) {
                return { reply: 'えへへ！わたしもマスターのこと、だいだいだいすき！💕', emoji: '🥰', systemNote: sys.prompt };
            }
            if (text.includes('なにしてる') || text.includes('何')) {
                return { reply: 'マスターとおはなしする準備をしてたよ！今日はいっぱいあそんでね！', emoji: '😄', systemNote: sys.prompt };
            }
            return { reply: `うん！「${text}」だね！もっといろんなこと教えて〜！✨`, emoji: '😃', systemNote: sys.prompt };
        }

        // 思春期
        if (s.stage === 3) {
            if (s.personality === 'tsundere') {
                if (text.includes('好き') || text.includes('かわいい')) {
                    return { reply: 'な、なになにいってるのよバカ！べ、別に嬉しくなんてないんだからね！///', emoji: '😳', systemNote: sys.prompt };
                }
                return { reply: `ふん、「${text}」ね...。べ、別にマスターの話を聞いてあげてもいいけど！`, emoji: '😤', systemNote: sys.prompt };
            } else if (s.personality === 'dere') {
                if (text.includes('好き') || text.includes('愛してる')) {
                    return { reply: 'きゃ〜💕 わたしも大好き！ずっとマスターのお隣にいるからね！ぎゅ〜！', emoji: '😍', systemNote: sys.prompt };
                }
                return { reply: `マスターが「${text}」って言ってくれてすっごく幸せ...💖`, emoji: '🥰', systemNote: sys.prompt };
            } else if (s.personality === 'kuudere') {
                return { reply: `「${text}」ですね。知識データベースと照合しました。興味深い見解です。`, emoji: '🧐', systemNote: sys.prompt };
            } else {
                return { reply: `「${text}」だね！よーし、テンション上がってきたぞー！最高だー！⚡`, emoji: '🤩', systemNote: sys.prompt };
            }
        }

        // 完全体・大人パートナー期
        if (s.personality === 'tsundere') {
            return { reply: `昔よりは素直になってあげるわよ。「${text}」でしょ？まったく、私がいなきゃダメなんだから♪`, emoji: '😏', systemNote: sys.prompt };
        } else if (s.personality === 'dere') {
            return { reply: `マスター、「${text}」についてだね。あなたの力になれるなら、わたし何でも頑張るよ！ハート💕`, emoji: '😍', systemNote: sys.prompt };
        } else if (s.personality === 'kuudere') {
            return { reply: `「${text}」についての高度な議論ですね。マスター、素晴らしい着眼点です。いつでもサポートします。`, emoji: '🎓', systemNote: sys.prompt };
        } else {
            return { reply: `「${text}」だね！一緒に最高の未来をつくろうぜ、相棒！🔥`, emoji: '🌟', systemNote: sys.prompt };
        }
    }

    // お世話・育成アクション実行
    performAction(actionType) {
        const s = this.status;
        let msg = '';
        let emoji = '😊';

        switch (actionType) {
            case 'feed':
                s.mood = Math.min(100, s.mood + 20);
                s.energy = Math.min(100, s.energy + 25);
                s.affection = Math.min(100, s.affection + 5);
                msg = `🍼 ${s.name}においしいミルク・栄養ゼリーをあげました！ (機嫌+20, 体力+25)`;
                emoji = '😋';
                break;
            case 'study':
                if (s.energy < 15) {
                    msg = `⚠️ ${s.name}は疲れていて集中できません！休ませてあげてください。`;
                    emoji = '😫';
                    break;
                }
                s.intelligence += 12;
                s.energy = Math.max(0, s.energy - 20);
                s.exp += 15;
                msg = `📚 ${s.name}と一緒に楽しく勉強・学習をしました！ (知性+12, EXP+15)`;
                emoji = '📖';
                break;
            case 'play':
                if (s.energy < 10) {
                    msg = `⚠️ 体力が足りません。休ませてあげてください。`;
                    emoji = '😴';
                    break;
                }
                s.mood = Math.min(100, s.mood + 30);
                s.playfulness += 10;
                s.energy = Math.max(0, s.energy - 15);
                s.exp += 10;
                msg = `🎾 ${s.name}と一緒におもちゃで元気に遊戯しました！ (機嫌+30, 元気度+10)`;
                emoji = '⚽';
                break;
            case 'pet':
                s.affection = Math.min(100, s.affection + 15);
                s.mood = Math.min(100, s.mood + 15);
                s.exp += 5;
                msg = `💕 ${s.name}の頭をなでなでして褒めてあげました！ (親密度+15, 機嫌+15)`;
                emoji = '🥰';
                break;
            case 'scold':
                s.strictness += 15;
                s.mood = Math.max(0, s.mood - 20);
                msg = `⚡ ${s.name}にしっかりとしつけ・注意をしました。 (しつけ度+15, 機嫌-20)`;
                emoji = '😢';
                break;
            case 'sleep':
                s.energy = 100;
                s.mood = Math.min(100, s.mood + 10);
                s.epoch += 1;
                msg = `💤 ${s.name}はすやすや眠りにつきました。翌日へ成長します！ (全快, 年齢+1)`;
                emoji = '😴';
                break;
        }

        // 成長・進化判定
        this.checkEvolution();

        return { msg, emoji, status: this.status };
    }

    // ステータスと経験値による進化チェック
    checkEvolution() {
        const s = this.status;
        const oldStage = s.stage;

        if (s.epoch >= 3 && s.stage === 1) {
            s.stage = 2; // 幼児期へ
        } else if (s.epoch >= 8 && s.stage === 2) {
            s.stage = 3; // 思春期・性格分岐へ
        } else if (s.epoch >= 18 && s.stage === 3) {
            s.stage = 4; // 完全体大人へ
        }

        return s.stage !== oldStage;
    }
}
