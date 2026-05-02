import { Token as TokenDTO } from "@dto/Token";
import { User as UserDTO } from "@dto/User";
import { UserDAO } from "@models/dao/UserDAO";
import { ErrorDTO } from "@models/dto/ErrorDTO";
import { UserType } from "@models/UserType";
import {NetworkDAO} from "@models/dao/NetworkDAO"
import { Network as NetworkDTO} from "@dto/Network";
import { Gateway } from "@models/dto/Gateway";

export function createErrorDTO(
  code: number,
  message?: string,
  name?: string
): ErrorDTO {
  return removeNullAttributes({
    code,
    name,
    message
  }) as ErrorDTO;
}

export function createTokenDTO(token: string): TokenDTO {
  return removeNullAttributes({
    token: token
  }) as TokenDTO;
}

export function createUserDTO(
  username: string,
  type: UserType,
  password?: string
): UserDTO {
  return removeNullAttributes({
    username,
    type,
    password
  }) as UserDTO;
}

export function mapUserDAOToDTO(userDAO: UserDAO): UserDTO {
  return createUserDTO(userDAO.username, userDAO.type);
}

function removeNullAttributes<T>(dto: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(dto).filter(
      ([_, value]) =>
        value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0)
    )
  ) as Partial<T>;
}

export function createNetworkDTO(
  code: string,
  name: string,
  description: string,
  gateways: Array<Gateway>
): NetworkDTO {
  return {
    code,
    name,
    description,
    gateways
  };
}

export function mapNetworkDAOToDTO(NetworkDAO: NetworkDAO): NetworkDTO {
  return createNetworkDTO(NetworkDAO.code, NetworkDAO.name, NetworkDAO.description, NetworkDAO.gateways || []);
}


