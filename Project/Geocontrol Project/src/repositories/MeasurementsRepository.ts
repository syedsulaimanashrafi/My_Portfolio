import { AppDataSource } from "@database";
import { Repository } from "typeorm";
import { MeasurementsDAO } from "@models/dao/MeasurementsDAO";
import { MeasurementDAO } from "@models/dao/MeasurementDAO";
import { findOrThrowNotFound, throwConflictIfFound } from "@utils";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@models/dao/SensorDAO";

// Utility functions for date handling
function toUTCString(date: Date | string): string {
  return new Date(date).toISOString();
}

function toUTCDate(date: Date | string): Date {
  return new Date(toUTCString(date));
}

function parseInputDate(dateString: string): Date {
  return toUTCDate(dateString);
}

export interface Stats {
    startDate?: Date;
    endDate?: Date;
    mean?: number;
    variance?: number;
    upperThreshold?: number;
    lowerThreshold?: number;
}

export class MeasurementsRepository {
    private repo: Repository<MeasurementsDAO>;
    private gatewayRepo = new GatewayRepository();
    private networkRepo = new NetworkRepository();
    private sensorRepo = new SensorRepository();
    private groupingRepo = AppDataSource.getRepository(MeasurementsDAO);

    constructor() {
        this.repo = AppDataSource.getRepository(MeasurementsDAO);
    }

    async storeMeasurements(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        measurements: Array<{ createdAt: Date; value: number; isOutlier?: boolean }>
    ): Promise<void> {
        await this.networkRepo.getNetworkByCode(networkCode);
        await this.gatewayRepo.getGateway(networkCode, gatewayMac);
        await this.sensorRepo.getSensor(networkCode, gatewayMac, sensorMac);

        let grouping = await this.groupingRepo.findOne({
            where: { sensorMacAddress: sensorMac },
            relations: ["measurements"]
        });

        if (!grouping) {
            grouping = new MeasurementsDAO();
            grouping.sensorMacAddress = sensorMac;
            grouping.measurements = [];
            await this.groupingRepo.save(grouping);
        }

        for (const m of measurements) {
            const mdao = new MeasurementDAO();
            mdao.createdAt = toUTCDate(m.createdAt);
            mdao.value = m.value;
            mdao.isOutlier = m.isOutlier ?? false;
            mdao.measurements = grouping;
            grouping.measurements.push(mdao);
        }

        await this.groupingRepo.save(grouping);
    }

    async getMeasPerNetwork(
        networkCode: string,
        sensorMacs: string[],
        startDate: string,
        endDate: string
    ): Promise<{
        sensorMacAddress: string;
        stats: {
            startDate: Date;
            endDate: Date;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
        } | null;
        measurements: {
            createdAt: Date;
            value: number;
            isOutlier: boolean;
        }[];
    }[]> {
        await this.networkRepo.getNetworkByCode(networkCode);
        
        const utcStartDate = parseInputDate(startDate);
        const utcEndDate = parseInputDate(endDate);

        const groups = await this.repo
            .createQueryBuilder("m")
            .leftJoinAndSelect("m.sensor", "s")
            .leftJoin("s.gateway", "g")
            .innerJoin("g.network", "n")
            .leftJoinAndSelect("m.measurements", "meas")
            .where("n.Code = :networkCode", { networkCode })
            .andWhere(sensorMacs.length > 0 ? "s.macAddress IN (:...sensorMacs)" : "1=1", { sensorMacs })
            .getMany();

        return groups.map(group => {
            const filteredMeasurements = group.measurements.filter(meas => {
                const createdAt = toUTCDate(meas.createdAt);
                return createdAt >= utcStartDate && createdAt <= utcEndDate;
            });

            const values = filteredMeasurements.map(m => m.value);
            let stats = null;

            if (values.length > 0) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
                const stdDev = Math.sqrt(variance);

                stats = {
                    startDate: utcStartDate,
                    endDate: utcEndDate,
                    mean: parseFloat(mean.toFixed(2)),
                    variance: parseFloat(variance.toFixed(2)),
                    upperThreshold: parseFloat((mean + 2 * stdDev).toFixed(2)),
                    lowerThreshold: parseFloat((mean - 2 * stdDev).toFixed(2))
                };
            }

            return {
                sensorMacAddress: group.sensor.macAddress,
                stats,
                measurements: filteredMeasurements.map(meas => ({
                    createdAt: toUTCDate(meas.createdAt),
                    value: parseFloat(meas.value.toFixed(4)),
                    isOutlier: stats !== null && 
                              (meas.value > stats.upperThreshold || 
                               meas.value < stats.lowerThreshold)
                }))
            };
        });
    }

    async getStatisticsPerSensorInNetwork(
        networkCode: string,
        sensorMacs: string[],
        startDate: string,
        endDate: string
    ): Promise<{
        sensorMac: string;
        stats?: {
            startDate: string;
            endDate: string;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
        };
    }[]> {
        await this.networkRepo.getNetworkByCode(networkCode);
        
        const utcStartDate = parseInputDate(startDate);
        const utcEndDate = parseInputDate(endDate);

        console.log(startDate, endDate)

        const measurementsGroups = await this.getMeasPerNetwork(
            networkCode,
            sensorMacs,
            startDate,
            endDate
        );

        console.log(measurementsGroups)

        return measurementsGroups.map(group => {
            if (!group.stats) return { sensorMac: group.sensorMacAddress, 
                stats: {
                    startDate: toUTCString(group.stats.startDate),
                    endDate: toUTCString(group.stats.endDate),
                    mean: 0,
                    variance: 0,
                    upperThreshold: 0,
                    lowerThreshold: 0
                }
             };

            return {
                sensorMac: group.sensorMacAddress,
                stats: {
                    startDate: toUTCString(group.stats.startDate),
                    endDate: toUTCString(group.stats.endDate),
                    mean: group.stats.mean,
                    variance: group.stats.variance,
                    upperThreshold: group.stats.upperThreshold,
                    lowerThreshold: group.stats.lowerThreshold
                }
            };
        });
    }

    async getMeasurementsForSingleSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate: string,
        endDate: string
    ): Promise<{
        sensorMacAddress: string;
        stats: {
            startDate: Date;
            endDate: Date;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
        };
        measurements: {
            createdAt: Date;
            value: number;
            isOutlier: boolean;
        }[];
    }> {
        await this.networkRepo.getNetworkByCode(networkCode);
        await this.gatewayRepo.getGateway(networkCode, gatewayMac);
        await this.sensorRepo.getSensor(networkCode, gatewayMac, sensorMac);

        const utcStartDate = parseInputDate(startDate);
        const utcEndDate = parseInputDate(endDate);

        const groups = await this.repo
            .createQueryBuilder("m")
            .leftJoinAndSelect("m.sensor", "s")
            .leftJoin("s.gateway", "g")
            .innerJoin("g.network", "n")
            .leftJoinAndSelect("m.measurements", "meas")
            .where("n.Code = :networkCode", { networkCode })
            .andWhere("g.macAddress = :gatewayMac", { gatewayMac })
            .andWhere("s.macAddress = :sensorMac", { sensorMac })
            .getMany();


        if (!groups || groups.length === 0) {
            return { 
                sensorMacAddress: sensorMac, 
                stats: {
                    startDate: utcStartDate,
                    endDate: utcEndDate,
                    mean: 0,
                    variance: 0,
                    upperThreshold: 0,
                    lowerThreshold: 0
                }, 
                measurements: [] 
            };
        }
        const group = groups[0];
        const filteredMeasurements = group.measurements.filter(meas => {
            const createdAt = toUTCDate(meas.createdAt);
            return createdAt >= utcStartDate && createdAt <= utcEndDate;
        });


        const values = filteredMeasurements.map(m => m.value);
        
        const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const variance = values.length > 0 ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length : 0;
        const stdDev = Math.sqrt(variance);


        const stats = {
            startDate: utcStartDate,
            endDate: utcEndDate,
            mean: mean,
            variance: parseFloat(variance.toFixed(2)),
            upperThreshold: parseFloat((mean + 2 * stdDev).toFixed(2)),
            lowerThreshold: parseFloat((mean - 2 * stdDev).toFixed(2))
        };

        return {
            sensorMacAddress: sensorMac,
            stats,
            measurements: filteredMeasurements.map(meas => ({
                createdAt: toUTCDate(meas.createdAt),
                value: parseFloat(meas.value.toFixed(4)),
                isOutlier: meas.value > stats.upperThreshold || meas.value < stats.lowerThreshold
            }))
        };
    }

    async getStatisticsForSingleSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate: string,
        endDate: string
    ): Promise<{
        sensorMac: string;
        stats?: {
            startDate: string;
            endDate: string;
            mean: number;
            variance: number;
            upperThreshold: number;
            lowerThreshold: number;
        };
    }> {
        const measurementData = await this.getMeasurementsForSingleSensor(
            networkCode,
            gatewayMac,
            sensorMac,
            startDate,
            endDate
        );

        return {
            sensorMac,
            stats: measurementData.stats ? {
                startDate: toUTCString(measurementData.stats.startDate),
                endDate: toUTCString(measurementData.stats.endDate),
                mean: measurementData.stats.mean,
                variance: measurementData.stats.variance,
                upperThreshold: measurementData.stats.upperThreshold,
                lowerThreshold: measurementData.stats.lowerThreshold
            } : undefined
        };
    }

    async getOutliersForSingleSensor(
        networkCode: string,
        gatewayMac: string,
        sensorMac: string,
        startDate: string,
        endDate: string
    ): Promise<{
        sensorMacAddress: string;
        stats: any;
        measurements: any[];
    }> {
        const measurementData = await this.getMeasurementsForSingleSensor(
            networkCode,
            gatewayMac,
            sensorMac,
            startDate,
            endDate
        );
        return {
            sensorMacAddress: sensorMac,
            stats: measurementData.stats,
            measurements: measurementData.measurements
                .filter(m => m.isOutlier === true)
                .map(m => ({
                    createdAt: toUTCString(m.createdAt),
                    value: m.value,
                    isOutlier: m.isOutlier 
                }))
        };
    }
}