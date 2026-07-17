import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AdicionarOrganizadorDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email!: string;
}