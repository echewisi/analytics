// src/kafka/kafka.consumer.ts

import { Injectable } from '@nestjs/common';
import { Kafka, logLevel } from 'kafkajs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAnalytics } from '../analytics/analytics.entity';
import { HotelAnalytics } from '../analytics/analytics.entity';
@Injectable()
export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer;

  constructor(
    @InjectRepository(UserAnalytics)
    private readonly userAnalyticsRepository: Repository<UserAnalytics>,
    @InjectRepository(HotelAnalytics)
    private readonly hotelAnalyticsRepository: Repository<HotelAnalytics>,
  ) {
    this.kafka = new Kafka({
      clientId: 'user-analytics-consumer',
      brokers: [process.env.KAFKA_HOST || 'localhost:9092'],
      logLevel: logLevel.INFO,
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'analytics-group',
    });
  }

  async connect() {
    await this.consumer.connect();
    await this.consumer.subscribe([
      { topic: 'user-events' },
      { topic: 'hotel-events' },
    ]);
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (topic === 'user-events') {
          this.handleUserEvent(message);
        } else if (topic === 'hotel-events') {
          this.handleHotelEvent(message);
        }
        console.log(
          `Received message on topic ${topic}, partition ${partition}:`,
        );
      },
    });
  }

  private async handleUserEvent(message) {
    try {
      const payload = JSON.parse(message.value.toString());

      // Check if the message is related to user registration
      if (payload && payload.type === 'userRegistered') {
        const userId = payload.userId; // Assuming the payload contains the user ID
        console.log('User registered. Storing user ID:', userId);

        // Save user ID and signup date to the database
        const userAnalytics = new UserAnalytics();
        userAnalytics.userid = userId;
        await this.userAnalyticsRepository.save(userAnalytics);

        console.log('User ID stored in analytics database:', userId);
      }
    } catch (error) {
      console.error('Error occurred while handling user event message:', error);
    }
  }

  private async handleHotelEvent(message) {
    try {
      const payload = JSON.parse(message.value.toString());

      // Check if the message is related to hotel booking
      if (payload && payload.type === 'hotelBooked') {
        const hotelTag = payload.hotelTag; // Assuming the payload contains the hotel tag
        console.log('Hotel booked. Hotel Tag:', hotelTag);

        // Increment total occupancy for the hotel in the analytics database
        const hotelAnalytics = await this.hotelAnalyticsRepository.findOne({
          where: { hotel_tag: hotelTag },
        });
        if (hotelAnalytics) {
          hotelAnalytics.total_occupancy++;
          await this.hotelAnalyticsRepository.save(hotelAnalytics);
          console.log('Total occupancy incremented for hotel:', hotelTag);
        } else {
          console.error(
            'Hotel analytics data not found for hotel tag:',
            hotelTag,
          );
        }
      }
    } catch (error) {
      console.error(
        'Error occurred while handling hotel event message:',
        error,
      );
    }
  }
}
