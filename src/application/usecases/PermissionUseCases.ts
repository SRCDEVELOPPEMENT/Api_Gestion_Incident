import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { CreatePermissionDTO, UpdatePermissionDTO, Permission } from '../../domain/entities/Permission';
import { BadRequestError, NotFoundError } from '../../domain/errors/AppError';

export class CreatePermissionUseCase {
  constructor(private repo: IPermissionRepository) {}
  async execute(data: CreatePermissionDTO): Promise<Permission> {
    const existing = await this.repo.findByAction(data.code);
    if (existing) throw new BadRequestError(`Permission with action '${data.code}' already exists`);
    return this.repo.create(data);
  }
}

export class GetAllPermissionsUseCase {
  constructor(private repo: IPermissionRepository) {}
  async execute(): Promise<Permission[]> {
    return this.repo.findAll();
  }
}

export class GetPermissionByIdUseCase {
  constructor(private repo: IPermissionRepository) {}
  async execute(id: string): Promise<Permission> {
    const permission = await this.repo.findById(Number(id));
    if (!permission) throw new NotFoundError('Permission not found');
    return permission;
  }
}

export class UpdatePermissionUseCase {
  constructor(private repo: IPermissionRepository) {}
  async execute(id: string, data: UpdatePermissionDTO): Promise<Permission> {
    const existing = await this.repo.findById(Number(id));
    if (!existing) throw new NotFoundError('Permission not found');
    
    if (data.code && data.code !== existing.code) {
       const duplicate = await this.repo.findByAction(data.code);
       if (duplicate) throw new BadRequestError(`Permission with action '${data.code}' already exists`);
    }

    return this.repo.update(Number(id), data);
  }
}

export class DeletePermissionUseCase {
  constructor(private repo: IPermissionRepository) {}
  async execute(id: string): Promise<void> {
    const existing = await this.repo.findById(Number(id));
    if (!existing) throw new NotFoundError('Permission not found');
    return this.repo.delete(Number(id));
  }
}
