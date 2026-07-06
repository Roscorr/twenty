import { Injectable, Logger } from '@nestjs/common';

import { type Manifest } from 'twenty-shared/application';
import { InstanceFileFolder } from 'twenty-shared/types';

import { ApplicationRegistrationSourceType } from 'src/engine/core-modules/application/application-registration/enums/application-registration-source-type.enum';
import { buildApplicationManifestResourcePath } from 'src/engine/core-modules/application/application-registration/utils/build-application-manifest-resource-path.util';
import { InstanceFileStorageService } from 'src/engine/core-modules/file-storage/instance-file-storage.service';
import {
  FileStorageException,
  FileStorageExceptionCode,
} from 'src/engine/core-modules/file-storage/interfaces/file-storage-exception';
import { type InstanceFileEntity } from 'src/engine/core-modules/file/entities/instance-file.entity';
import { streamToBuffer } from 'src/utils/stream-to-buffer';

@Injectable()
export class ApplicationManifestStorageService {
  private readonly logger = new Logger(ApplicationManifestStorageService.name);

  constructor(
    private readonly instanceFileStorageService: InstanceFileStorageService,
  ) {}

  async writeManifest({
    applicationRegistrationId,
    manifest,
    sourceType,
    version,
  }: {
    applicationRegistrationId: string;
    manifest: Manifest;
    sourceType: ApplicationRegistrationSourceType;
    version?: string | null;
  }): Promise<InstanceFileEntity> {
    const serializedManifest = JSON.stringify(manifest);

    const resourcePath = buildApplicationManifestResourcePath({
      applicationRegistrationId,
      sourceType,
      version,
      serializedManifest,
    });

    return this.instanceFileStorageService.writeInstanceFile({
      fileFolder: InstanceFileFolder.ApplicationRegistration,
      resourcePath,
      contents: serializedManifest,
      mimeType: 'application/json',
      applicationRegistrationId,
    });
  }

  async readManifest(instanceFileId: string): Promise<Manifest | null> {
    try {
      const stream =
        await this.instanceFileStorageService.readInstanceFileById(
          instanceFileId,
        );

      const content = (await streamToBuffer(stream)).toString('utf-8');

      return JSON.parse(content) as Manifest;
    } catch (error) {
      if (
        error instanceof FileStorageException &&
        error.code === FileStorageExceptionCode.FILE_NOT_FOUND
      ) {
        this.logger.warn(`Manifest instance file ${instanceFileId} not found`);

        return null;
      }

      throw error;
    }
  }
}
