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
