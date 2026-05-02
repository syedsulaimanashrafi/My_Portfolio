import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { GatewayDAO } from './GatewayDAO';
import { MeasurementsDAO } from './MeasurementsDAO';

@Entity('sensor')
export class SensorDAO {
  @PrimaryColumn()
  macAddress: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  variable: string;

  @Column()
  unit: string;

  @Column() // <-- Add this FK column explicitly
  gatewayId: string;

  @ManyToOne(() => GatewayDAO, (gateway) => gateway.sensors, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gatewayId', referencedColumnName: 'macAddress' })
  gateway: GatewayDAO;

  @OneToMany(() => MeasurementsDAO, (grp) => grp.sensor)
  measurementsGroup: MeasurementsDAO[];
}
