import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Entity,
} from 'typeorm';

@Entity('analytics')
export class UserAnalytics {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 500 })
  userid: string;

  @CreateDateColumn()
  registered_at: Date;
}

export class HotelAnalytics {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ length: 6 })
  hotel_tag: string;

  @Column()
  total_occupancy: number;
}
