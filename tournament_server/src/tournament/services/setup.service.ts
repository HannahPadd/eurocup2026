import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setup } from '@persistence/entities';
import { CreateSetupDto, UpdateSetupDto } from '../dtos';

@Injectable()
export class SetupService {
    constructor(
        @InjectRepository(Setup)
        private setupRepository: Repository<Setup>
    ) { }

    async create(dto: CreateSetupDto) {
        const setup = new Setup();

        setup.name = dto.name;
        setup.cabinetName = dto.cabinetName;
        setup.position = dto.position;

        await this.setupRepository.save(setup);

        return setup;
    }

    async findAll() {
        return await this.setupRepository.find();
    }

    async findOne(id: number) {
        return await this.setupRepository.findOneBy({ id });
    }

    async update(id: number, dto: UpdateSetupDto) {
        const setup = await this.setupRepository.findOneBy({ id });

        if (!setup) {
            throw new NotFoundException(`Setuè with ID ${id} not found`);
        }

        this.setupRepository.merge(setup, dto);

        return await this.setupRepository.save(setup);
    }

    async remove(id: number) {
        await this.setupRepository.delete(id);
    }
}
