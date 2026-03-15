import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateModelingLog1770596408048 implements MigrationInterface {
    name = 'UpdateModelingLog1770596408048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "modeling_logs" DROP COLUMN "newValue"`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" DROP COLUMN "oldValue"`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" ADD "old_value" text`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" ADD "new_value" text`);
        await queryRunner.query(`ALTER TABLE "printers" ALTER COLUMN "powerConsumptionKw" SET DEFAULT '0.35'`);
        await queryRunner.query(`ALTER TABLE "printers" ALTER COLUMN "failureRate" SET DEFAULT '0.05'`);
        await queryRunner.query(`ALTER TABLE "printers" ALTER COLUMN "profitMargin" SET DEFAULT '1.3'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "printers" ALTER COLUMN "profitMargin" SET DEFAULT 1.3`);
        await queryRunner.query(`ALTER TABLE "printers" ALTER COLUMN "failureRate" SET DEFAULT 0.05`);
        await queryRunner.query(`ALTER TABLE "printers" ALTER COLUMN "powerConsumptionKw" SET DEFAULT 0.35`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" DROP COLUMN "new_value"`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" DROP COLUMN "old_value"`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" ADD "oldValue" text`);
        await queryRunner.query(`ALTER TABLE "modeling_logs" ADD "newValue" text`);
    }

}
