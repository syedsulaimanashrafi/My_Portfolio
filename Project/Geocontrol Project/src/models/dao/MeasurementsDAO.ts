// src/models/dao/MeasurementsDAO.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import type { Stats } from '@dto/Stats';
import { MeasurementDAO } from './MeasurementDAO';
import { SensorDAO } from './SensorDAO';


@Entity('measurements')
export class MeasurementsDAO {
  @PrimaryColumn()
  sensorMacAddress: string;

  @ManyToOne(() => SensorDAO, (sensor) => sensor.measurementsGroup, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sensorMacAddress', referencedColumnName: 'macAddress' })
  sensor: SensorDAO;

  @Column('simple-json', { nullable: true })
  stats?: Stats;

  @OneToMany(() => MeasurementDAO, (m) => m.measurements, {
    cascade: true,
    eager: true,
  })
  measurements: MeasurementDAO[];
}
