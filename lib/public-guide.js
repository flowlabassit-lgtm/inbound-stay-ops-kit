export function getPublicStayGuideSections(config = {}) {
  return (config.approvedStayGuide || []).filter((section) => section?.hostApproved === true);
}
