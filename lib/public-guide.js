export function getPublicStayGuideSections(config = {}) {
  return (config.approvedStayGuide || []).filter((section) => section?.hostApproved === true);
}

export function getPublicLocalRecommendations(config = {}) {
  return (config.localGuide?.recommendations || [])
    .filter((recommendation) => recommendation?.hostApproved === true)
    .map((recommendation) => ({
      id: recommendation.id,
      category: recommendation.category || "local_tip",
      name: recommendation.name || {},
      description: recommendation.description || {},
      distanceText: recommendation.distanceText || {},
      sourceType: recommendation.sourceType || "host",
      sourceUrl: recommendation.sourceUrl || "",
      lastReviewedAt: recommendation.lastReviewedAt || null
    }));
}

export function getLocalGuideBoundary(config = {}) {
  const configured = config.localGuide?.boundary;
  return configured || {
    en:
      "Nearby tips use official place APIs through a server-side proxy or host-approved recommendations. This static kit does not scrape maps, review pages, logged-in services, or copied review text.",
    ko:
      "주변 추천은 서버 측 공식 장소 API 프록시 또는 호스트가 승인한 추천만 사용합니다. 이 정적 키트는 지도, 리뷰 페이지, 로그인 서비스, 리뷰 원문을 스크래핑하지 않습니다.",
    ja:
      "周辺おすすめは、サーバー側の公式プレイスAPIプロキシ、またはホスト承認済みの推薦のみを使います。この静的キットは地図、レビュー画面、ログインサービス、レビュー本文をスクレイピングしません。"
  };
}
