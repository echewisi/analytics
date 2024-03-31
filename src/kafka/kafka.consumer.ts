// src/kafka/kafka.consumer.ts

import { Injectable } from '@nestjs/common';
import { Client, Consumer, ConsumerConfig } from 'kafka-node';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAnalytics } from '../analytics/analytics.entity';

@Injectable()
export class KafkaConsumerService {
  private client: Client;
  private consumer: Consumer;
  constructor(
    @InjectRepository(UserAnalytics)
    private readonly analyticsRepository: Repository<UserAnalytics>,
  ) {
    this.client = new Client(process.env.KAFKA_HOST || 'localhost:9092');

    const kafkaConsumerConfig: ConsumerConfig = {
      kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
      groupId: process.env.KAFKA_GROUP_ID || 'analytics-group',
      autoCommit: true,
    };

    this.consumer = new Consumer(
      this.client,
      [{ topic: 'user-events' }],
      kafkaConsumerConfig,
    );

    this.consumer.on('message', this.handleMessage.bind(this));
    this.consumer.on('error', this.handleError.bind(this));
  }

  private async handleMessage(message) {
    try {
      // Check if the message is related to user registration
      if (message && message.type === 'userRegistered') {
        const userId = message.payload.userId; // Assuming the payload contains the user ID
        console.log('User registered. Storing user ID:', userId);

        // Save user ID and signup date to the database
        const userAnalytics = new UserAnalytics();
        userAnalytics.userid = userId;
        await this.analyticsRepository.save(userAnalytics);

        console.log('User ID stored in analytics database:', userId);
      }
    } catch (error) {
      console.error('Error occurred while handling message:', error);
    }
  }

  private handleError(error) {
    console.error('Error occurred:', error);
  }
}
