/*
  Warnings:

  - You are about to drop the column `backgroundUrl` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "backgroundUrl",
DROP COLUMN "photoUrl",
ADD COLUMN     "image" TEXT;
