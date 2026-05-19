import { AuthService } from '../../infrastructure/services/AuthService.js';
import { RoomService } from '../../infrastructure/services/RoomService.js';
import { MessageService } from '../../infrastructure/services/MessageService.js';
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository.js';
import { MongoRoomRepository } from '../../infrastructure/repositories/MongoRoomRepository.js';
import { MongoMessageRepository } from '../../infrastructure/repositories/MongoMessageRepository.js';
import { MongoSessionRepository } from '../../infrastructure/repositories/MongoSessionRepository.js';
import { BcryptService } from '../../infrastructure/security/BcryptService.js';
import { JwtService } from '../../infrastructure/security/JwtService.js';
import { RegisterUserUseCase } from '../usecases/auth/RegisterUserUseCase.js';
import { LoginUserUseCase } from '../usecases/auth/LoginUserUseCase.js';
import { CreateRoomUseCase } from '../usecases/room/CreateRoomUseCase.js';
import { JoinRoomUseCase } from '../usecases/room/JoinRoomUseCase.js';
import { LeaveRoomUseCase } from '../usecases/room/LeaveRoomUseCase.js';
import { ListRoomsUseCase } from '../usecases/room/ListRoomsUseCase.js';
import { SendMessageUseCase } from '../usecases/message/SendMessageUseCase.js';
import { GetRoomHistoryUseCase } from '../usecases/message/GetRoomHistoryUseCase.js';
import { ListPendingUsersUseCase } from '../usecases/admin/ListPendingUsersUseCase.js';
import { ApproveUserUseCase } from '../usecases/admin/ApproveUserUseCase.js';
import { RejectUserUseCase } from '../usecases/admin/RejectUserUseCase.js';
import { ClearRoomMessagesUseCase } from '../usecases/admin/ClearRoomMessagesUseCase.js';

export class Container {
  public readonly authService: AuthService;
  public readonly roomService: RoomService;
  public readonly messageService: MessageService;
  public readonly registerUseCase: RegisterUserUseCase;
  public readonly loginUseCase: LoginUserUseCase;
  public readonly createRoomUseCase: CreateRoomUseCase;
  public readonly joinRoomUseCase: JoinRoomUseCase;
  public readonly leaveRoomUseCase: LeaveRoomUseCase;
  public readonly listRoomsUseCase: ListRoomsUseCase;
  public readonly sendMessageUseCase: SendMessageUseCase;
  public readonly getRoomHistoryUseCase: GetRoomHistoryUseCase;
  public readonly listPendingUsersUseCase: ListPendingUsersUseCase;
  public readonly approveUserUseCase: ApproveUserUseCase;
  public readonly rejectUserUseCase: RejectUserUseCase;
  public readonly clearRoomMessagesUseCase: ClearRoomMessagesUseCase;

  constructor() {
    const userRepository = new MongoUserRepository();
    const roomRepository = new MongoRoomRepository();
    const messageRepository = new MongoMessageRepository();
    const sessionRepository = new MongoSessionRepository();
    const hashingService = new BcryptService();
    const jwtService = new JwtService();

    this.authService = new AuthService(userRepository, sessionRepository, hashingService, jwtService);
    this.roomService = new RoomService(roomRepository, hashingService);
    this.messageService = new MessageService(messageRepository);

    this.registerUseCase = new RegisterUserUseCase(this.authService);
    this.loginUseCase = new LoginUserUseCase(this.authService);
    this.listRoomsUseCase = new ListRoomsUseCase(this.roomService);
    this.createRoomUseCase = new CreateRoomUseCase(this.roomService);
    this.joinRoomUseCase = new JoinRoomUseCase(this.roomService);
    this.leaveRoomUseCase = new LeaveRoomUseCase(this.roomService);
    this.sendMessageUseCase = new SendMessageUseCase(this.messageService);
    this.getRoomHistoryUseCase = new GetRoomHistoryUseCase(this.messageService);
    this.listPendingUsersUseCase = new ListPendingUsersUseCase(userRepository);
    this.approveUserUseCase = new ApproveUserUseCase(userRepository);
    this.rejectUserUseCase = new RejectUserUseCase(userRepository);
    this.clearRoomMessagesUseCase = new ClearRoomMessagesUseCase(roomRepository, this.messageService);
  }
}
