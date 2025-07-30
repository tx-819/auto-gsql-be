import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatTopic } from './chat-topic.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('chat_message')
export class ChatMessage {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'topic_id', type: 'bigint' })
  topicId: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatTopic, (topic) => topic.messages)
  @JoinColumn({ name: 'topic_id' })
  topic: ChatTopic;
}
