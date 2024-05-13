-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "player1Id" INTEGER NOT NULL,
    "player2Id" INTEGER NOT NULL,
    "player1Score" INTEGER NOT NULL,
    "player2Score" INTEGER NOT NULL,
    "winnerId" INTEGER,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
