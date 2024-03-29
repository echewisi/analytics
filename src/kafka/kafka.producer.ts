import { Injectable } from '@nestjs/common';
import { Client, Consumer, ConsumerConfig } from 'kafka-node';

@Injectable()
export class KafkaConsumerService {
  private client: Client;
  private consumer: Consumer;

  constructor() {
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

  private handleMessage(message) {
    // Handle message here
    console.log('Received message:', message);

    // Check if the message is related to user registration
    if (message && message.type === 'userRegistered') {
      const userId = message.payload.userId; // Assuming the payload contains the user ID
      console.log('User registered. Storing user ID:', userId);

      // Perform the necessary action, such as storing the user ID in the database
      // Example: this.analyticsService.storeUserId(userId);
    }
  }

  private handleError(error) {
    // Handle error
    console.error('Error occurred:', error);
  }
}
