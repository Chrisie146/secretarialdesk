export function documentLabel(documentType) {
  return {
    share_register: 'Share Register',
    moi: 'MoI',
    trust_deed: 'Trust Deed',
    mandate_to_file: 'Mandate to File',
    cipc_filing_pack: 'CIPC / Company Document'
  }[documentType] || documentType;
}
