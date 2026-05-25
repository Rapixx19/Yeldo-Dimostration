-- CreateEnum
CREATE TYPE "Instrument" AS ENUM ('senior_loan', 'mezzanine', 'senior_debt', 'secured_mezzanine');

-- CreateEnum
CREATE TYPE "Distribution" AS ENUM ('quarterly', 'at_maturity');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('open', 'closed', 'exited');

-- CreateEnum
CREATE TYPE "SentimentLabel" AS ENUM ('bullish', 'neutral', 'cautious');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "instrument" "Instrument" NOT NULL,
    "targetRaise" DOUBLE PRECISION NOT NULL,
    "raisedAmount" DOUBLE PRECISION NOT NULL,
    "targetIRR" DOUBLE PRECISION NOT NULL,
    "maturityMonths" INTEGER NOT NULL,
    "loanToValue" DOUBLE PRECISION NOT NULL,
    "distribution" "Distribution" NOT NULL,
    "minimumTicket" DOUBLE PRECISION NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'open',
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3),
    "sentimentLabel" "SentimentLabel" NOT NULL,
    "sentimentScore" DOUBLE PRECISION NOT NULL,
    "sentimentSignals" JSONB NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "sponsorDescription" TEXT NOT NULL,
    "hasFirstLienMortgage" BOOLEAN NOT NULL DEFAULT true,
    "risks" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "investedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "deals_slug_key" ON "deals"("slug");

-- CreateIndex
CREATE INDEX "investments_userId_idx" ON "investments"("userId");

-- CreateIndex
CREATE INDEX "investments_dealId_idx" ON "investments"("dealId");

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

