"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Zap, Target, Shuffle } from "lucide-react"

interface DiceGame {
  id: string
  result?: number
  isRolling: boolean
  bet: number
  prediction: number
  winnings?: number
}

export default function MiniGames() {
  const [activeGame, setActiveGame] = useState<"dice" | "coin" | "wheel">("dice")
  const [diceGame, setDiceGame] = useState<DiceGame>({
    id: "dice-1",
    isRolling: false,
    bet: 100,
    prediction: 4,
  })
  const [balance, setBalance] = useState(5000)

  const getDiceIcon = (number: number) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
    const Icon = icons[number - 1] || Dice1
    return <Icon size={48} className="text-white" />
  }

  const rollDice = async () => {
    if (diceGame.isRolling || balance < diceGame.bet) return

    setDiceGame((prev) => ({ ...prev, isRolling: true, result: undefined, winnings: undefined }))
    setBalance((prev) => prev - diceGame.bet)

    // Simulate rolling animation
    const rollDuration = 2000
    const rollInterval = 100
    const rollSteps = rollDuration / rollInterval

    for (let i = 0; i < rollSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, rollInterval))
      setDiceGame((prev) => ({ ...prev, result: Math.floor(Math.random() * 6) + 1 }))
    }

    // Final result
    const finalResult = Math.floor(Math.random() * 6) + 1
    const isWin = finalResult === diceGame.prediction
    const winnings = isWin ? diceGame.bet * 6 : 0

    setDiceGame((prev) => ({
      ...prev,
      result: finalResult,
      isRolling: false,
      winnings,
    }))

    if (isWin) {
      setBalance((prev) => prev + winnings)
    }
  }

  const games = [
    { id: "dice", name: "Dice Roll", icon: Dice1, color: "from-red-500 to-pink-500" },
    { id: "coin", name: "Coin Flip", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { id: "wheel", name: "Spin Wheel", icon: Target, color: "from-green-500 to-blue-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Game Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl flex items-center">
            <Shuffle className="mr-2 text-purple-400" size={20} />
            Mini Games
          </h3>
          <div className="text-white/70 text-sm">Balance: KES {balance.toLocaleString()}</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {games.map((game) => {
            const Icon = game.icon
            return (
              <motion.button
                key={game.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveGame(game.id as any)}
                className={`p-4 rounded-xl text-center transition-all ${
                  activeGame === game.id ? `bg-gradient-to-r ${game.color} shadow-lg` : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <Icon size={24} className="mx-auto mb-2 text-white" />
                <div className="text-white text-sm font-medium">{game.name}</div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Dice Game */}
      <AnimatePresence mode="wait">
        {activeGame === "dice" && (
          <motion.div
            key="dice-game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-6"
          >
            <h4 className="text-white font-bold text-lg mb-6 text-center">🎲 Dice Roll Game</h4>

            {/* Dice Display */}
            <div className="text-center mb-8">
              <motion.div
                animate={diceGame.isRolling ? { rotateX: 360, rotateY: 360 } : {}}
                transition={{ duration: 0.5, repeat: diceGame.isRolling ? Number.POSITIVE_INFINITY : 0 }}
                className="inline-block p-6 bg-white/10 rounded-2xl mb-4"
              >
                {diceGame.result ? getDiceIcon(diceGame.result) : getDiceIcon(1)}
              </motion.div>

              {diceGame.winnings !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-2xl font-bold ${diceGame.winnings > 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {diceGame.winnings > 0 ? `🎉 Won KES ${diceGame.winnings}!` : "😔 Try Again!"}
                </motion.div>
              )}
            </div>

            {/* Game Controls */}
            <div className="space-y-4">
              {/* Bet Amount */}
              <div>
                <label className="text-white/70 text-sm">Bet Amount</label>
                <div className="flex space-x-2 mt-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <motion.button
                      key={amount}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDiceGame((prev) => ({ ...prev, bet: amount }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        diceGame.bet === amount
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      KES {amount}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Prediction */}
              <div>
                <label className="text-white/70 text-sm">Predict the Number (6x payout)</label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6].map((number) => (
                    <motion.button
                      key={number}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDiceGame((prev) => ({ ...prev, prediction: number }))}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold transition-all ${
                        diceGame.prediction === number
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {number}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Roll Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={rollDice}
                disabled={diceGame.isRolling || balance < diceGame.bet}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {diceGame.isRolling ? "Rolling..." : `Roll Dice - KES ${diceGame.bet}`}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Coin Flip Game */}
        {activeGame === "coin" && (
          <motion.div
            key="coin-game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6"
          >
            <h4 className="text-white font-bold text-lg mb-6 text-center">🪙 Coin Flip Game</h4>
            <div className="text-center py-12 text-white/60">
              <Zap size={64} className="mx-auto mb-4 opacity-50" />
              <p>Coming Soon!</p>
            </div>
          </motion.div>
        )}

        {/* Spin Wheel Game */}
        {activeGame === "wheel" && (
          <motion.div
            key="wheel-game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6"
          >
            <h4 className="text-white font-bold text-lg mb-6 text-center">🎯 Spin Wheel Game</h4>
            <div className="text-center py-12 text-white/60">
              <Target size={64} className="mx-auto mb-4 opacity-50" />
              <p>Coming Soon!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
