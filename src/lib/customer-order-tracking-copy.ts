import type { CustomerLocale } from "@/store/customer-locale-store";
import type { OrderStatus } from "@/lib/types";

export type OrderTrackingCopy = {
  statusBadge: string;
  liveUpdate: string;
  title: string;
  notice: string;
  orderNo: string;
  seat: string;
  progress: string;
  progressHint: string;
  progressHintSides: string;
  noodleHintBelow: string;
  noodlePartialTitle: string;
  noodlePartialBodyBefore: string;
  noodlePartialBodyBar: string;
  noodlePartialBodyMid: string;
  noodlePartialBodyNoodle: string;
  noodlePartialBodyAfter: string;
  noodleDelivery: string;
  noodleAllDeliveredTitle: string;
  noodleStatusTitle: string;
  noodlePartialStatusTitle: string;
  noodleAllDeliveredBody: string;
  noodleNoneDeliveredBody: string;
  noodleSomeDeliveredBody: string;
  noNoodlesTitle: string;
  noNoodlesBody: string;
  orderContents: string;
  noodleDeliveredCount: (delivered: number, total: number) => string;
  allItemsHint: string;
  delivered: string;
  arrivedAtTable: string;
  notDeliveredShort: string;
  notDeliveredTitle: string;
  notDeliveredAria: string;
  lastUpdated: (time: string) => string;
  autoRefreshNote: string;
  orderMore: string;
  backHome: string;
  loading: string;
  loadFailed: string;
  notFound: string;
  thanksVisit: string;
  thanksPaid: string;
  thanksAgain: string;
  toMenu: string;
  orderIdMissing: string;
  pageLoading: string;
  backToMenu: string;
  thanksEyebrow: string;
  thanksMergedTitle: string;
  thanksNewTitle: string;
  thanksMergedBody: string;
  thanksBullet1: string;
  thanksBullet2: string;
  thanksBullet3: string;
  thanksBullet4: string;
  status: Record<OrderStatus, { headline: string; detail: string }>;
  steps: { label: string; short: string }[];
};

const ja: OrderTrackingCopy = {
  statusBadge: "ご注文の状況",
  liveUpdate: "自動更新",
  title: "ご注文の準備状況",
  notice: "ご案内",
  orderNo: "注文番号",
  seat: "お席",
  progress: "進捗",
  progressHint: "店舗でのご注文全体の処理の流れです。",
  progressHintSides:
    "ドリンク・サイド等のお届けは一覧の品目ごとの表示をご確認ください。",
  noodleHintBelow:
    "麺類（つけ麺・多聞つけ麺・ラーメン・替え玉等）のお届け状況は、下の「麺類のお届け」をご覧ください。",
  noodlePartialTitle: "麺類について",
  noodlePartialBodyBefore: "お届け済みの麺と、これからお届けする麺が混在しています。",
  noodlePartialBodyBar: "進捗バー",
  noodlePartialBodyMid: "は店舗でのご注文全体の段階、",
  noodlePartialBodyNoodle: "「麺類のお届け」",
  noodlePartialBodyAfter: "と一覧で品目ごとの状況をご確認ください。",
  noodleDelivery: "麺類のお届け",
  noodleAllDeliveredTitle: "お席へのお届け（麺類）",
  noodleStatusTitle: "麺類のお届け状況",
  noodlePartialStatusTitle: "お届け状況（麺類・一部済み）",
  noodleAllDeliveredBody: "ご注文の麺類はすべてお席にお届けしました。",
  noodleNoneDeliveredBody:
    "準備が整い次第お届けします。ドリンク等は一覧の各品表示をご確認ください。",
  noodleSomeDeliveredBody:
    "お届け済みの麺と、これからお届けする麺が混在しています。一覧でもご確認ください。",
  noNoodlesTitle: "麺類のご注文がない場合",
  noNoodlesBody:
    "上の進捗は店舗でのご注文全体の流れです。各商品のお届けは下の一覧でご確認ください。",
  orderContents: "ご注文内容",
  noodleDeliveredCount: (d, t) => `麺類 お届け ${d}/${t}`,
  allItemsHint: "全品のお届け状況は各行をご確認ください（麺以外も表示されます）",
  delivered: "お届け済み",
  arrivedAtTable: "お席に到着",
  notDeliveredShort: "未",
  notDeliveredTitle: "お席へ未お届け",
  notDeliveredAria: "まだお席へお届けしていません",
  lastUpdated: (time) => `最終更新 ${time}`,
  autoRefreshNote: "この画面を開いたままでも最新に更新されます",
  orderMore: "追加で注文する",
  backHome: "ホームへ戻る",
  loading: "お客様のご注文を読み込み中…",
  loadFailed: "読み込みに失敗しました。",
  notFound: "この注文は見つかりませんでした。",
  thanksVisit: "本日はご来店ありがとうございました",
  thanksPaid: "お会計までお済ませいただき、誠にありがとうございました。",
  thanksAgain: "またのご来店を、心よりお待ちしております。",
  toMenu: "メニューへ",
  orderIdMissing: "注文番号が指定されていません。",
  pageLoading: "読み込み中…",
  backToMenu: "メニューに戻る",
  thanksEyebrow: "ご注文を承りました",
  thanksMergedTitle: "ご注文に追加いたしました。\nありがとうございます。",
  thanksNewTitle: "この度はご注文を賜り、\n誠にありがとうございます。",
  thanksMergedBody:
    "既存の注文にカートの内容を加えました。合計は追跡画面でご確認ください。",
  thanksBullet1: "ただいま料理人が一品一品、心を尽くしてご用意を進めております。",
  thanksBullet2: "ご注文の進行状況につきましては、本画面にて随時ご確認いただけます。",
  thanksBullet3: "お料理が最良の状態でお手元に届きますよう、丁寧に仕上げてまいります。",
  thanksBullet4: "どうぞ、ひとときの時間もごゆっくりお楽しみくださいませ。",
  status: {
    pending: {
      headline: "キッチンに届けました",
      detail: "ご注文を受け付けました。順番にご準備いたします。",
    },
    confirmed: {
      headline: "内容を確認しました",
      detail: "もうすぐ準備に入ります。少々お待ちください。",
    },
    preparing: {
      headline: "丁寧に準備中です",
      detail: "仕上がり次第、ステータスが更新されます。",
    },
    ready: {
      headline: "提供の準備ができました",
      detail: "スタッフがお席へお持ちします。",
    },
    served: {
      headline: "お席へお届け済みです",
      detail: "お支払いは商品お受け取り時、またはレジにてお願いします。",
    },
    paid: {
      headline: "ありがとうございました",
      detail:
        "本日のご来店ありがとうございました。またのお越しをお待ちしています。",
    },
    cancelled: {
      headline: "ご注文はキャンセルされました",
      detail: "ご不明点があればスタッフまでお声がけください。",
    },
  },
  steps: [
    { label: "受付・確認", short: "受付" },
    { label: "準備中", short: "準備" },
    { label: "提供準備", short: "提供待ち" },
    { label: "お届け", short: "届済" },
    { label: "会計完了", short: "完了" },
  ],
};

const en: OrderTrackingCopy = {
  statusBadge: "Order status",
  liveUpdate: "Live",
  title: "Order progress",
  notice: "Notice",
  orderNo: "Order no.",
  seat: "Table",
  progress: "Progress",
  progressHint: "This shows the overall status of your order at the restaurant.",
  progressHintSides:
    "For drinks and sides, check the delivery status on each line below.",
  noodleHintBelow:
    "For noodles (tsukemen, Tamon, ramen, kaedama, etc.), see “Noodle delivery” below.",
  noodlePartialTitle: "About noodles",
  noodlePartialBodyBefore:
    "Some noodles have been delivered; others are still on the way.",
  noodlePartialBodyBar: "The progress bar",
  noodlePartialBodyMid: " shows the overall order stage. Use ",
  noodlePartialBodyNoodle: "“Noodle delivery”",
  noodlePartialBodyAfter: " and the item list for per-item status.",
  noodleDelivery: "Noodle delivery",
  noodleAllDeliveredTitle: "Noodles delivered to your table",
  noodleStatusTitle: "Noodle delivery status",
  noodlePartialStatusTitle: "Noodle delivery (partial)",
  noodleAllDeliveredBody: "All noodle items have been delivered to your table.",
  noodleNoneDeliveredBody:
    "We’ll bring them when ready. Check each line below for drinks and other items.",
  noodleSomeDeliveredBody:
    "Some noodles are delivered; others are still coming. Check the list below.",
  noNoodlesTitle: "No noodle items in this order",
  noNoodlesBody:
    "The progress above is for the whole order. Check each item’s status in the list below.",
  orderContents: "Your order",
  noodleDeliveredCount: (d, t) => `Noodles delivered ${d}/${t}`,
  allItemsHint: "Check each line for delivery status (including non-noodle items)",
  delivered: "Delivered",
  arrivedAtTable: "At your table",
  notDeliveredShort: "—",
  notDeliveredTitle: "Not delivered yet",
  notDeliveredAria: "Not delivered to your table yet",
  lastUpdated: (time) => `Updated ${time}`,
  autoRefreshNote: "This screen updates automatically while open",
  orderMore: "Order more",
  backHome: "Back to home",
  loading: "Loading your order…",
  loadFailed: "Failed to load.",
  notFound: "We couldn’t find this order.",
  thanksVisit: "Thank you for visiting today",
  thanksPaid: "Thank you for dining with us.",
  thanksAgain: "We look forward to seeing you again.",
  toMenu: "Back to menu",
  orderIdMissing: "No order number was specified.",
  pageLoading: "Loading…",
  backToMenu: "Back to menu",
  thanksEyebrow: "Order received",
  thanksMergedTitle: "Items added to your order.\nThank you!",
  thanksNewTitle: "Thank you for your order.",
  thanksMergedBody:
    "Your cart items were added to the existing order. Check the total on this screen.",
  thanksBullet1: "Our kitchen is carefully preparing each dish for you.",
  thanksBullet2: "You can follow progress anytime on this screen.",
  thanksBullet3: "We’ll finish each dish carefully so it arrives at its best.",
  thanksBullet4: "Please relax and enjoy your time.",
  status: {
    pending: {
      headline: "Sent to the kitchen",
      detail: "We’ve received your order and will prepare it in turn.",
    },
    confirmed: {
      headline: "Order confirmed",
      detail: "We’ll start preparing shortly. Please wait a moment.",
    },
    preparing: {
      headline: "Preparing carefully",
      detail: "Status updates when your order is ready.",
    },
    ready: {
      headline: "Ready to serve",
      detail: "Staff will bring it to your table.",
    },
    served: {
      headline: "Delivered to your table",
      detail: "Please pay when you receive your items, or at the register.",
    },
    paid: {
      headline: "Thank you",
      detail: "Thank you for visiting. We look forward to seeing you again.",
    },
    cancelled: {
      headline: "Order cancelled",
      detail: "Please ask staff if you have any questions.",
    },
  },
  steps: [
    { label: "Received", short: "Recv." },
    { label: "Preparing", short: "Prep" },
    { label: "Ready", short: "Ready" },
    { label: "Delivered", short: "Done" },
    { label: "Paid", short: "Paid" },
  ],
};

const zh: OrderTrackingCopy = {
  statusBadge: "订单状态",
  liveUpdate: "自动更新",
  title: "准备进度",
  notice: "提示",
  orderNo: "订单号",
  seat: "座位",
  progress: "进度",
  progressHint: "这是本店处理整笔订单的整体流程。",
  progressHintSides: "饮品与小食的送达状态，请查看下方各品目。",
  noodleHintBelow: "面类（沾面、多闻、拉面、替玉等）的送达情况，请看下方「面类送达」。",
  noodlePartialTitle: "关于面类",
  noodlePartialBodyBefore: "已有面类送达，还有部分尚未送达。",
  noodlePartialBodyBar: "进度条",
  noodlePartialBodyMid: "表示整笔订单阶段，请结合",
  noodlePartialBodyNoodle: "「面类送达」",
  noodlePartialBodyAfter: "与下方列表查看各品状态。",
  noodleDelivery: "面类送达",
  noodleAllDeliveredTitle: "面类已送至座位",
  noodleStatusTitle: "面类送达情况",
  noodlePartialStatusTitle: "面类送达（部分完成）",
  noodleAllDeliveredBody: "您点的面类已全部送到座位。",
  noodleNoneDeliveredBody: "准备好后会立即送达。饮品等请查看下方各品显示。",
  noodleSomeDeliveredBody: "部分面类已送达，还有部分在路上。也可在列表中确认。",
  noNoodlesTitle: "本单没有面类",
  noNoodlesBody: "上方进度是整笔订单流程。各商品送达请看下方列表。",
  orderContents: "订单内容",
  noodleDeliveredCount: (d, t) => `面类已送达 ${d}/${t}`,
  allItemsHint: "请查看每一行的送达状态（含非面类）",
  delivered: "已送达",
  arrivedAtTable: "已到座位",
  notDeliveredShort: "未",
  notDeliveredTitle: "尚未送达座位",
  notDeliveredAria: "尚未送到座位",
  lastUpdated: (time) => `最后更新 ${time}`,
  autoRefreshNote: "保持本页打开即可自动更新",
  orderMore: "继续点单",
  backHome: "返回首页",
  loading: "正在加载您的订单…",
  loadFailed: "加载失败。",
  notFound: "未找到该订单。",
  thanksVisit: "感谢您今日光临",
  thanksPaid: "感谢您完成结账，欢迎再次光临。",
  thanksAgain: "期待再次见到您。",
  toMenu: "返回菜单",
  orderIdMissing: "未指定订单号。",
  pageLoading: "加载中…",
  backToMenu: "返回菜单",
  thanksEyebrow: "已收到订单",
  thanksMergedTitle: "已追加到您的订单。\n谢谢！",
  thanksNewTitle: "感谢您的订购。",
  thanksMergedBody: "购物车内容已并入现有订单。合计请在本页确认。",
  thanksBullet1: "厨房正在用心准备每一道菜。",
  thanksBullet2: "您可随时在本页查看进度。",
  thanksBullet3: "我们会仔细完成，让菜品以最佳状态送到您手中。",
  thanksBullet4: "请稍作休息，慢慢享用。",
  status: {
    pending: {
      headline: "已送到厨房",
      detail: "已收到订单，将按顺序准备。",
    },
    confirmed: {
      headline: "内容已确认",
      detail: "即将开始准备，请稍候。",
    },
    preparing: {
      headline: "正在精心准备",
      detail: "完成后状态会更新。",
    },
    ready: {
      headline: "准备就绪",
      detail: "店员将送到您的座位。",
    },
    served: {
      headline: "已送到座位",
      detail: "请在取餐时或收银台结账。",
    },
    paid: {
      headline: "谢谢惠顾",
      detail: "感谢光临，欢迎再次到来。",
    },
    cancelled: {
      headline: "订单已取消",
      detail: "如有疑问请联系店员。",
    },
  },
  steps: [
    { label: "受理确认", short: "受理" },
    { label: "准备中", short: "准备" },
    { label: "待提供", short: "待送" },
    { label: "已送达", short: "送达" },
    { label: "已结账", short: "完成" },
  ],
};

const ko: OrderTrackingCopy = {
  statusBadge: "주문 현황",
  liveUpdate: "자동 갱신",
  title: "준비 현황",
  notice: "안내",
  orderNo: "주문 번호",
  seat: "테이블",
  progress: "진행",
  progressHint: "매장에서 주문 전체를 처리하는 흐름입니다.",
  progressHintSides: "음료·사이드 배달 상태는 아래 품목별 표시를 확인해 주세요.",
  noodleHintBelow:
    "면류(쓰케멘·다몬·라멘·가에다마 등) 배달 상황은 아래 「면류 배달」을 봐 주세요.",
  noodlePartialTitle: "면류 안내",
  noodlePartialBodyBefore: "이미 배달된 면과 아직 배달 중인 면이 섞여 있습니다.",
  noodlePartialBodyBar: "진행 바",
  noodlePartialBodyMid: "는 주문 전체 단계이고, ",
  noodlePartialBodyNoodle: "「면류 배달」",
  noodlePartialBodyAfter: "과 목록에서 품목별 상태를 확인해 주세요.",
  noodleDelivery: "면류 배달",
  noodleAllDeliveredTitle: "면류 테이블 배달 완료",
  noodleStatusTitle: "면류 배달 상황",
  noodlePartialStatusTitle: "면류 배달(일부 완료)",
  noodleAllDeliveredBody: "주문하신 면류는 모두 테이블에 배달되었습니다.",
  noodleNoneDeliveredBody:
    "준비가 되면 배달합니다. 음료 등은 아래 각 품목 표시를 확인해 주세요.",
  noodleSomeDeliveredBody:
    "일부 면은 배달되었고, 나머지는 준비 중입니다. 목록에서도 확인해 주세요.",
  noNoodlesTitle: "면류 주문이 없는 경우",
  noNoodlesBody:
    "위 진행은 주문 전체 흐름입니다. 각 상품 배달은 아래 목록에서 확인해 주세요.",
  orderContents: "주문 내용",
  noodleDeliveredCount: (d, t) => `면류 배달 ${d}/${t}`,
  allItemsHint: "전 품목 배달 상태는 각 행을 확인해 주세요(면 외 포함)",
  delivered: "배달 완료",
  arrivedAtTable: "테이블 도착",
  notDeliveredShort: "미",
  notDeliveredTitle: "아직 미배달",
  notDeliveredAria: "아직 테이블에 배달되지 않았습니다",
  lastUpdated: (time) => `마지막 업데이트 ${time}`,
  autoRefreshNote: "이 화면을 열어 두면 자동으로 갱신됩니다",
  orderMore: "추가 주문하기",
  backHome: "홈으로",
  loading: "주문을 불러오는 중…",
  loadFailed: "불러오기에 실패했습니다.",
  notFound: "주문을 찾을 수 없습니다.",
  thanksVisit: "오늘 방문해 주셔서 감사합니다",
  thanksPaid: "결제가 완료되었습니다. 이용해 주셔서 감사합니다.",
  thanksAgain: "다시 뵙기를 기다리겠습니다.",
  toMenu: "메뉴로",
  orderIdMissing: "주문 번호가 지정되지 않았습니다.",
  pageLoading: "로딩 중…",
  backToMenu: "메뉴로 돌아가기",
  thanksEyebrow: "주문을 접수했습니다",
  thanksMergedTitle: "주문에 추가되었습니다.\n감사합니다.",
  thanksNewTitle: "주문해 주셔서\n감사합니다.",
  thanksMergedBody:
    "장바구니 내용이 기존 주문에 추가되었습니다. 합계는 이 화면에서 확인해 주세요.",
  thanksBullet1: "주방에서 한 그릇씩 정성껏 준비하고 있습니다.",
  thanksBullet2: "진행 상황은 이 화면에서 언제든 확인할 수 있습니다.",
  thanksBullet3: "최상의 상태로 전달되도록 꼼꼼히 마무리하겠습니다.",
  thanksBullet4: "잠시 여유를 즐겨 주세요.",
  status: {
    pending: {
      headline: "주방에 전달됨",
      detail: "주문을 접수했습니다. 순서대로 준비합니다.",
    },
    confirmed: {
      headline: "내용 확인됨",
      detail: "곧 준비를 시작합니다. 잠시만 기다려 주세요.",
    },
    preparing: {
      headline: "정성껏 준비 중",
      detail: "완성되면 상태가 업데이트됩니다.",
    },
    ready: {
      headline: "제공 준비 완료",
      detail: "직원이 테이블로 가져다 드립니다.",
    },
    served: {
      headline: "테이블 배달 완료",
      detail: "수령 시 또는 계산대에서 결제해 주세요.",
    },
    paid: {
      headline: "감사합니다",
      detail: "방문해 주셔서 감사합니다. 또 뵙겠습니다.",
    },
    cancelled: {
      headline: "주문이 취소되었습니다",
      detail: "문의는 직원에게 말씀해 주세요.",
    },
  },
  steps: [
    { label: "접수·확인", short: "접수" },
    { label: "준비 중", short: "준비" },
    { label: "제공 대기", short: "대기" },
    { label: "배달", short: "배달" },
    { label: "결제 완료", short: "완료" },
  ],
};

export function orderTrackingCopy(locale: CustomerLocale): OrderTrackingCopy {
  if (locale === "en") return en;
  if (locale === "zh") return zh;
  if (locale === "ko") return ko;
  return ja;
}

export function formatCustomerTime(iso: string, locale: CustomerLocale): string {
  const tag =
    locale === "en" ? "en-US" : locale === "zh" ? "zh-CN" : locale === "ko" ? "ko-KR" : "ja-JP";
  return new Date(iso).toLocaleTimeString(tag, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
