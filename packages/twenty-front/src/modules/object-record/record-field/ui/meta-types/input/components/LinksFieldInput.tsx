import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useLinksField } from '@/object-record/record-field/ui/meta-types/hooks/useLinksField';
import { LinksFieldMenuItem } from '@/object-record/record-field/ui/meta-types/input/components/LinksFieldMenuItem';
import { MULTI_ITEM_FIELD_INPUT_DROPDOWN_ID_PREFIX } from '@/object-record/record-field/ui/meta-types/input/constants/MultiItemFieldInputDropdownClickOutsideId';
import { getFieldLinkDefinedLinks } from '@/object-record/record-field/ui/meta-types/input/utils/getFieldLinkDefinedLinks';
import { recordFieldInputIsFieldInErrorComponentState } from '@/object-record/record-field/ui/states/recordFieldInputIsFieldInErrorComponentState';
import { type FieldLinksValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { linksFieldValueSchema } from '@/object-record/record-field/ui/validation-schemas/linksFieldValueSchema';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { styled } from '@linaria/react';
import { isNonEmptyString } from '@sniptt/guards';
import { useContext, useMemo, useRef } from 'react';
import { MULTI_ITEM_FIELD_DEFAULT_MAX_VALUES } from 'twenty-shared/constants';
import { absoluteUrlSchema, isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { MultiItemFieldInput } from './MultiItemFieldInput';

type LinkRecord = {
  url: string | null;
  label: string | null;
};

const StyledLinkInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledInput = styled.input`
  background-color: transparent;
  border: none;
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  font-family: ${themeCssVariables.font.family};
  font-size: inherit;
  font-weight: inherit;
  height: 32px;
  outline: none;
  padding: ${themeCssVariables.spacing[0]} ${themeCssVariables.spacing[2]};
  width: 100%;

  &::placeholder,
  &::-webkit-input-placeholder {
    color: ${themeCssVariables.font.color.light};
    font-family: ${themeCssVariables.font.family};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

export const LinksFieldInput = () => {
  const { draftValue, fieldDefinition, setDraftValue } = useLinksField();

  const { onEscape, onClickOutside, onEnter } = useContext(
    FieldInputEventContext,
  );

  const links = useMemo<{ url: string; label: string | null }[]>(
    () => getFieldLinkDefinedLinks(draftValue),
    [draftValue],
  );

  // The label is an uncontrolled input seeded from the edited item; its value is
  // read here on save. The URL keeps flowing through the shared string pipeline.
  const labelInputRef = useRef<HTMLInputElement>(null);

  const parseArrayToLinksValue = (links: LinkRecord[]) => {
    const nextPrimaryLink = links.at(0);
    const nextSecondaryLinks = links.slice(1);
    const nextValue: FieldLinksValue = {
      primaryLinkUrl: nextPrimaryLink?.url ?? null,
      primaryLinkLabel: nextPrimaryLink?.label ?? null,
      secondaryLinks: nextSecondaryLinks,
    };
    const parseResponse = linksFieldValueSchema.safeParse(nextValue);
    if (parseResponse.success) {
      return parseResponse.data;
    }
  };

  const handleChange = (
    updatedLinks: { url: string | null; label: string | null }[],
  ) => {
    const nextValue = parseArrayToLinksValue(updatedLinks);

    if (isDefined(nextValue)) {
      setDraftValue(nextValue);
    }
  };

  const getShowPrimaryIcon = (index: number) => index === 0 && links.length > 1;
  const getShowSetAsPrimaryButton = (index: number) => index > 0;

  const setRecordFieldInputIsFieldInError = useSetAtomComponentState(
    recordFieldInputIsFieldInErrorComponentState,
  );

  const handleError = (hasError: boolean, values: any[]) => {
    setRecordFieldInputIsFieldInError(hasError && values.length === 0);
  };

  const handleClickOutside = (
    updatedLinks: LinkRecord[],
    event: MouseEvent | TouchEvent,
  ) => {
    onClickOutside?.({ newValue: parseArrayToLinksValue(updatedLinks), event });
  };

  const handleEscape = (updatedLinks: LinkRecord[]) => {
    onEscape?.({ newValue: parseArrayToLinksValue(updatedLinks) });
  };

  const handleEnter = (updatedLinks: LinkRecord[]) => {
    onEnter?.({ newValue: parseArrayToLinksValue(updatedLinks) });
  };

  const maxNumberOfValues =
    fieldDefinition.metadata.settings?.maxNumberOfValues ??
    MULTI_ITEM_FIELD_DEFAULT_MAX_VALUES;

  return (
    <MultiItemFieldInput
      items={links}
      onChange={handleChange}
      onEscape={handleEscape}
      onEnter={handleEnter}
      onClickOutside={handleClickOutside}
      placeholder="URL"
      fieldMetadataType={FieldMetadataType.LINKS}
      validateInput={(input) => ({
        isValid: absoluteUrlSchema.safeParse(input).success,
        errorMessage: '',
      })}
      onError={handleError}
      formatInput={(input) => ({
        url: input,
        label: isNonEmptyString(labelInputRef.current?.value)
          ? labelInputRef.current.value
          : null,
      })}
      renderInput={({ value, onChange, autoFocus, placeholder, itemIndex }) => (
        <StyledLinkInputContainer>
          <StyledInput
            autoFocus={autoFocus}
            value={(value as string) ?? ''}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
          <StyledInput
            // Remount per edited item so the label reseeds from that item.
            key={itemIndex ?? 'new'}
            ref={labelInputRef}
            defaultValue={
              isDefined(itemIndex) ? (links[itemIndex]?.label ?? '') : ''
            }
            placeholder="Label"
          />
        </StyledLinkInputContainer>
      )}
      renderItem={({
        value: link,
        index,
        handleEdit,
        handleSetPrimary,
        handleDelete,
      }) => (
        <LinksFieldMenuItem
          key={index}
          dropdownId={`${MULTI_ITEM_FIELD_INPUT_DROPDOWN_ID_PREFIX}-${fieldDefinition.metadata.fieldName}-${index}`}
          showPrimaryIcon={getShowPrimaryIcon(index)}
          showSetAsPrimaryButton={getShowSetAsPrimaryButton(index)}
          label={link.label}
          onEdit={handleEdit}
          onSetAsPrimary={handleSetPrimary}
          onDelete={handleDelete}
          url={link.url}
        />
      )}
      maxItemCount={maxNumberOfValues}
    />
  );
};
