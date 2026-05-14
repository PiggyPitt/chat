import { AppError } from '../errors/AppError';
import { LoginPayload, RegisterPayload, RoomPayload, MessagePayload } from './schemas';

const minLength = 3;
const maxLength = 100;

function validateText(name: string, value: string): void {
  if (!value || value.trim().length < minLength) {
    throw new AppError(`${name} must be at least ${minLength} characters`, 400);
  }
  if (value.length > maxLength) {
    throw new AppError(`${name} must be ${maxLength} characters or less`, 400);
  }
}

export function validateRegister(payload: RegisterPayload): void {
  validateText('Username', payload.username);
  validateText('Password', payload.password);
}

export function validateLogin(payload: LoginPayload): void {
  validateText('Username', payload.username);
  validateText('Password', payload.password);
}

export function validateRoom(payload: RoomPayload): void {
  validateText('Room name', payload.name);
}

export function validateMessage(payload: MessagePayload): void {
  validateText('Room ID', payload.roomId);
  validateText('Message', payload.content);
}
