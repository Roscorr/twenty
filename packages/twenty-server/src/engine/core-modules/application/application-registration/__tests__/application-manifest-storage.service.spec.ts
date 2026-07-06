import { Test, type TestingModule } from '@nestjs/testing';

import { Readable } from 'stream';

import { type Manifest } from 'twenty-shared/application';
import { InstanceFileFolder } from 'twenty-shared/types';

import { ApplicationManifestStorageService } from 'src/engine/core-modules/application/application-registration/application-manifest-storage.service';
import { ApplicationRegistrationSourceType } from 'src/engine/core-modules/application/application-registration/enums/application-registration-source-type.enum';
import { InstanceFileStorageService } from 'src/engine/core-modules/file-storage/instance-file-storage.service';
import {
  FileStorageException,
  FileStorageExceptionCode,
} from 'src/engine/core-modules/file-storage/interfaces/file-storage-exception';
import { type InstanceFileEntity } from 'src/engine/core-modules/file/entities/instance-file.entity';

describe('ApplicationManifestStorageService', () => {
  let service: ApplicationManifestStorageService;
  let instanceFileStorageService: jest.Mocked<
    Pick<
      InstanceFileStorageService,
      'writeInstanceFile' | 'readInstanceFileById'
    >
  >;

  const applicationRegistrationId = 'a3d8e9f0-1234-4b5c-8d6e-7f8a9b0c1d2e';
  const instanceFileId = 'b4e9f0a1-5678-4c6d-9e7f-8a9b0c1d2e3f';
  const manifest = {
    application: { displayName: 'Test App' },
  } as unknown as Manifest;

  beforeEach(async () => {
    instanceFileStorageService = {
      writeInstanceFile: jest.fn(),
      readInstanceFileById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationManifestStorageService,
        {
          provide: InstanceFileStorageService,
          useValue: instanceFileStorageService,
        },
      ],
    }).compile();

    service = module.get(ApplicationManifestStorageService);

    jest.clearAllMocks();
  });

  describe('writeManifest', () => {
    it('should write the serialized manifest as an instance file and return it', async () => {
      const instanceFile = { id: instanceFileId } as InstanceFileEntity;

      instanceFileStorageService.writeInstanceFile.mockResolvedValue(
        instanceFile,
      );

      const result = await service.writeManifest({
        applicationRegistrationId,
        manifest,
        sourceType: ApplicationRegistrationSourceType.NPM,
        version: '2.0.0',
      });

      expect(result).toBe(instanceFile);
      expect(instanceFileStorageService.writeInstanceFile).toHaveBeenCalledWith(
        {
          fileFolder: InstanceFileFolder.ApplicationRegistration,
          resourcePath: `${applicationRegistrationId}/manifests/2.0.0.json`,
          contents: JSON.stringify(manifest),
          mimeType: 'application/json',
          applicationRegistrationId,
        },
      );
    });

    it('should write to the dev path when source type is LOCAL', async () => {
      instanceFileStorageService.writeInstanceFile.mockResolvedValue({
        id: instanceFileId,
      } as InstanceFileEntity);

      await service.writeManifest({
        applicationRegistrationId,
        manifest,
        sourceType: ApplicationRegistrationSourceType.LOCAL,
        version: '2.0.0',
      });

      expect(instanceFileStorageService.writeInstanceFile).toHaveBeenCalledWith(
        expect.objectContaining({
          resourcePath: `${applicationRegistrationId}/manifests/dev.json`,
        }),
      );
    });

    it('should throw when the instance file write fails', async () => {
      instanceFileStorageService.writeInstanceFile.mockRejectedValue(
        new Error('storage unavailable'),
      );

      await expect(
        service.writeManifest({
          applicationRegistrationId,
          manifest,
          sourceType: ApplicationRegistrationSourceType.NPM,
          version: '2.0.0',
        }),
      ).rejects.toThrow('storage unavailable');
    });
  });

  describe('readManifest', () => {
    it('should read and parse the manifest from the instance file', async () => {
      instanceFileStorageService.readInstanceFileById.mockResolvedValue(
        Readable.from([Buffer.from(JSON.stringify(manifest), 'utf-8')]),
      );

      await expect(service.readManifest(instanceFileId)).resolves.toEqual(
        manifest,
      );
      expect(
        instanceFileStorageService.readInstanceFileById,
      ).toHaveBeenCalledWith(instanceFileId);
    });

    it('should return null when the instance file is not found', async () => {
      instanceFileStorageService.readInstanceFileById.mockRejectedValue(
        new FileStorageException(
          'not found',
          FileStorageExceptionCode.FILE_NOT_FOUND,
        ),
      );

      await expect(service.readManifest(instanceFileId)).resolves.toBeNull();
    });

    it('should rethrow unexpected read failures', async () => {
      instanceFileStorageService.readInstanceFileById.mockRejectedValue(
        new Error('storage unavailable'),
      );

      await expect(service.readManifest(instanceFileId)).rejects.toThrow(
        'storage unavailable',
      );
    });

    it('should throw when the stored content is not valid JSON', async () => {
      instanceFileStorageService.readInstanceFileById.mockResolvedValue(
        Readable.from([Buffer.from('not-json', 'utf-8')]),
      );

      await expect(service.readManifest(instanceFileId)).rejects.toThrow();
    });
  });
});
