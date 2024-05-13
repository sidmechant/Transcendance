-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "displayname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "profileurl" TEXT NOT NULL,
    "emails" TEXT NOT NULL,
    "phoneNumbers" TEXT NOT NULL,
    "photourl" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_displayname_key" ON "User"("displayname");

-- CreateIndex
CREATE UNIQUE INDEX "User_profileurl_key" ON "User"("profileurl");

-- CreateIndex
CREATE UNIQUE INDEX "User_emails_key" ON "User"("emails");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumbers_key" ON "User"("phoneNumbers");

-- CreateIndex
CREATE UNIQUE INDEX "User_photourl_key" ON "User"("photourl");
