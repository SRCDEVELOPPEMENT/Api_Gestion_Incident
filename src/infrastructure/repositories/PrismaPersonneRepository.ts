import { IPersonneRepository } from '../../domain/repositories/IPersonneRepository';
import {
  Personne,
  CreatePersonneDTO,
  UpdatePersonneDTO
} from '../../domain/entities/Personne';
import prisma from '../database/prisma';

export class PrismaPersonneRepository implements IPersonneRepository {

  /* ---------------- CREATE ---------------- */

  async create(data: CreatePersonneDTO): Promise<Personne> {

    const created = await prisma.personne.create({
      data: {
        fullname: data.fullname
      }
    });

    return this.mapToDomain(created);
  }

  /* ---------------- FIND ALL ---------------- */

  async findAll(skip = 0, take = 50): Promise<Personne[]> {

    const personnes = await prisma.personne.findMany({
      skip,
      take,
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return personnes.map(p => this.mapToDomain(p));
  }

  /* ---------------- FIND BY ID ---------------- */

  async findById(id: string): Promise<Personne | null> {

    const personne = await prisma.personne.findFirst({
      where: {
        id: Number(id),
        deletedAt: null
      }
    });

    if (!personne) return null;

    return this.mapToDomain(personne);
  }

  /* ---------------- UPDATE ---------------- */

  async update(
    id: string,
    data: UpdatePersonneDTO
  ): Promise<Personne> {

    const updated = await prisma.personne.update({
      where: {
        id: Number(id)
      },
      data: {
        ...(data.fullname && { fullname: data.fullname })
      }
    });

    return this.mapToDomain(updated);
  }

  /* ---------------- DELETE (SOFT DELETE) ---------------- */

  async delete(id: string): Promise<void> {

    await prisma.personne.update({
      where: {
        id: Number(id)
      },
      data: {
        deletedAt: new Date()
      }
    });
  }

  /* ---------------- MAPPER ---------------- */

  private mapToDomain(prismaPersonne: any): Personne {
    return {
      id: prismaPersonne.id,
      fullname: prismaPersonne.fullname,
      createdAt: prismaPersonne.createdAt,
      updatedAt: prismaPersonne.updatedAt,
      deletedAt: prismaPersonne.deletedAt
    };
  }
}
