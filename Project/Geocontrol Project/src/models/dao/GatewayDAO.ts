import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { NetworkDAO } from '@models/dao/NetworkDAO';
import { SensorDAO } from './SensorDAO';

@Entity('gateways')
export class GatewayDAO {
  @PrimaryColumn({ nullable: false })
  @Index()
  macAddress: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  description: string;

  @ManyToOne(() => NetworkDAO, (network) => network.gateways, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'networkCode', referencedColumnName: 'code' }) // optional
  network: NetworkDAO;

  @OneToMany(() => SensorDAO, (sensor) => sensor.gateway, {
    cascade: true,
    eager: true, // if you want sensors fetched automatically
  })
  sensors: SensorDAO[];
}
