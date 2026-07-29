import type { CustomerLocale } from "@/store/customer-locale-store";

type Copy = {
  menuEyebrow: string;
  menuTagline: string;
  tableLabel: string;
  tabRamen: string;
  tabGyozaDrink: string;
  addToCart: string;
  soldOutBadge: string;
  soldOutShort: string;
  soldOutHint: string;
  signatureBadge: string;
  photoFallback: string;
  photoNoteTitle: string;
  photoNoteBody: string;
  photoNoteEnOnly: string | null;
  tsukemenDiffTitle: string;
  tsukemenDiffBody: string;
  toppingNote: string;
  addedToCart: (name: string) => string;
  // modal
  addToOrder: string;
  perItem: string;
  close: string;
  photo: string;
  orderMethod: string;
  required: string;
  orderMethodHint: string;
  dineIn: string;
  dineInSub: string;
  takeaway: string;
  takeawaySub: string;
  containerFee: string;
  containerFeeHint: string;
  bagNeeded: string;
  bagNeededHint: string;
  seat: string;
  seatOptional: string;
  seatPlaceholder: string;
  pleaseChoose: string;
  beerHint: string;
  highballHint: string;
  beerBallHint: string;
  noodleAmount: string;
  noodleAmountHint: string;
  noodleAmountLarge: string;
  noodleAmountLargeHint: string;
  toppings: string;
  toppingsHint: string;
  noodleTemp: string;
  noodleTempRequired: string;
  noodleTempPreset: string;
  noodleTempHintRequired: string;
  noodleTempHintOptional: string;
  quickNotes: string;
  requests: string;
  requestsOptional: string;
  requestsPlaceholder: string;
  requestsHint: string;
  qty: string;
  addToCartBtn: string;
  pick150200: string;
  pickLargePortion: string;
  pickColdHot: string;
  pickBeer: string;
  pickHighball: string;
  pickBeerBall: string;
  lager: string;
  superDry: string;
  plain: string;
  lemon: string;
  plum: string;
  melon: string;
  coldNoodle: string;
  hotNoodle: string;
  // cart
  viewCart: string;
  goCheckout: string;
  orderProgressAria: string;
  // checkout
  cartEmpty: string;
  cartEmptyHint: string;
  seeMenu: string;
  backToMenu: string;
  checkoutEyebrow: string;
  checkoutTitle: string;
  cartItemsCount: (n: number) => string;
  orderContents: string;
  remove: string;
  howToOrder: string;
  howToOrderBody: string;
  howToOrderSub: string;
  locationChecking: string;
  locationOutside: string;
  locationOutsideHint: string;
  locationUnavailable: string;
  flowTitle: string;
  flow1: string;
  flow2: string;
  flow3: string;
  flow4: string;
  waterTitle: string;
  waterBody: string;
  guideTitle: string;
  guideBody: string;
  subtotal: string;
  placeOrder: string;
  placeOrderAppend: string;
  sending: string;
  errorTitle: string;
  tryAgain: string;
  orderDone: string;
  toMenu: string;
  appendOrder: string;
  appendOrderBody: string;
  mergePaid: string;
  mergeCancelled: string;
  mergeTableMismatch: string;
  mergeNew: string;
};

const ja: Copy = {
  menuEyebrow: "メニュー",
  menuTagline: "つけ麺・らーめん、餃子お持ち帰り",
  tableLabel: "ご利用席",
  tabRamen: "つけ麺・ラーメン",
  tabGyozaDrink: "ぎょうざ・ドリンク",
  addToCart: "カートに追加",
  soldOutBadge: "本日売切",
  soldOutShort: "売り切れ",
  soldOutHint: "申し訳ございません、ただ今はご注文いただけません。",
  signatureBadge: "当店一番人気 · 多聞",
  photoFallback: "写真",
  photoNoteTitle: "写真について",
  photoNoteBody:
    "メニュー掲載の写真の一部は、お料理の盛り付けイメージとして掲載しております。お客様にはご理解賜りますよう、何卒よろしくお願い申し上げます。",
  photoNoteEnOnly: null,
  tsukemenDiffTitle: "★ つけ麺と多聞つけ麺 違いは麺のみです",
  tsukemenDiffBody:
    "つけ麺はつるつる、なめらかなのどごし。多聞はもっちり、噛みごたえのある風味豊かな全粒粉麺です。",
  toppingNote: "ラーメンをご注文の際にトッピングをどうぞ！単品での注文は出来ません。",
  addedToCart: (name) => `${name} をカートに追加しました`,
  addToOrder: "ご注文に追加",
  perItem: "/ 点",
  close: "閉じる",
  photo: "写真",
  orderMethod: "ご注文方法",
  required: "必須",
  orderMethodHint: "店内でお召し上がり、またはお持ち帰りをお選びください。",
  dineIn: "店内で",
  dineInSub: "お席へお届け",
  takeaway: "お持ち帰り",
  takeawaySub: "テイクアウト",
  containerFee: "容器代",
  containerFeeHint: "お持ち帰りは容器が必要です",
  bagNeeded: "レジ袋が必要",
  bagNeededHint: "必要な方のみお選びください",
  seat: "席",
  seatOptional: "（任意）",
  seatPlaceholder: "例：A, B, 1, 2 → 8",
  pleaseChoose: "お選びください",
  beerHint: "ラガー または スーパードライ",
  highballHint: "プレーン ¥400 / レモン ¥450",
  beerBallHint: "レモン・うめ・メロン（いずれか1つ）",
  noodleAmount: "麺の量",
  noodleAmountHint: "同価 · 150g または 200g をお選びください",
  noodleAmountLarge: "麺の量（500g以上）",
  noodleAmountLargeHint: "お好みの麺量をお選びください。",
  toppings: "トッピング",
  toppingsHint: "麺類におすすめの追加トッピングです。",
  noodleTemp: "麺の温度",
  noodleTempRequired: "必須",
  quickNotes: "かんたんメモ",
  requests: "ご要望・メモ",
  requestsOptional: "（任意）",
  requestsPlaceholder: "例：水菜抜き、メンマ抜き、など",
  requestsHint: "トッピング・アレルギーなど、ご要望がございましたらご記入ください。空欄のままでも問題ございません。",
  noodleTempPreset: "麺の温度",
  noodleTempHintRequired: "冷たい麺・温かい麺のいずれかをお選びください。",
  noodleTempHintOptional: "お好みの麺の温度をお選びください。",
  qty: "数量",
  addToCartBtn: "カートに追加",
  pick150200: "上の「150g」または「200g」をお選びください。",
  pickLargePortion: "上の麺量をお選びください。",
  pickColdHot: "上の「冷たい麺」または「温かい麺」をお選びください。",
  pickBeer: "上の「ラガー」または「スーパードライ」をお選びください。",
  pickHighball: "上の「プレーン」または「レモン」をお選びください。",
  pickBeerBall: "上のフレーバーをお選びください。",
  lager: "ラガー",
  superDry: "スーパードライ",
  plain: "プレーン",
  lemon: "レモン",
  plum: "うめ",
  melon: "メロン",
  coldNoodle: "冷たい麺",
  hotNoodle: "温かい麺",
  viewCart: "カートを見る",
  goCheckout: "注文手続きへ",
  orderProgressAria: "ご注文の進捗を全画面で見る",
  cartEmpty: "カートは空です",
  cartEmptyHint: "メニューから商品を追加してください。",
  seeMenu: "メニューを見る",
  backToMenu: "メニューに戻る",
  checkoutEyebrow: "ご注文手続き",
  checkoutTitle: "ご注文内容の確認",
  cartItemsCount: (n) => `カート内 ${n} 品`,
  orderContents: "ご注文内容",
  remove: "削除",
  howToOrder: "ご注文方法",
  howToOrderBody: "お席のQRコードを読み取ってご注文ください。",
  howToOrderSub: "お待たせせず、スムーズにご注文いただけます。",
  locationChecking: "位置情報を確認しています…",
  locationOutside: "ご注文は店内でお願いします",
  locationOutsideHint: "お手元のQRはお席でスキャンしてご利用ください。",
  locationUnavailable:
    "位置情報が利用できませんでした。店内の方はそのままご注文いただけます。",
  flowTitle: "ご利用の流れ",
  flow1: "QRコードを読み取り、商品をお選びください",
  flow2: "ご注文後、キッチンにて準備いたします",
  flow3: "商品が出来上がりましたら、お席までお持ちいたします",
  flow4: "お支払いはレジにてお願いいたします",
  waterTitle: "お水について",
  waterBody: "お水はお席にご用意しております。ご自由にお飲みください。",
  guideTitle: "ご案内",
  guideBody: "ご不明な点がございましたら、スタッフまでお気軽にお声がけください。",
  subtotal: "合計",
  placeOrder: "注文を送信する",
  placeOrderAppend: "追加の内容を送信する",
  sending: "送信中…",
  errorTitle: "エラーが発生しました",
  tryAgain: "もう一度試す",
  orderDone: "ご注文は完了しました。",
  toMenu: "メニューへ",
  appendOrder: "追加のご注文です",
  appendOrderBody:
    "カートの内容は、現在ご利用中の注文にまとめてお届けします。送信後は同じ注文番号で追跡いただけます。",
  mergePaid: "この注文は会計済みのため、同じ注文には追加できません。新規のご注文として送信してください。",
  mergeCancelled:
    "この注文はキャンセル済みのため、同じ注文には追加できません。新規注文として送信されます。",
  mergeTableMismatch: "卓番が元の注文と異なるため、新規注文として送信されます。",
  mergeNew: "新規注文として送信されます。",
};

const en: Copy = {
  menuEyebrow: "Menu",
  menuTagline: "Tsukemen, ramen & takeaway gyoza",
  tableLabel: "Your table",
  tabRamen: "Tsukemen & Ramen",
  tabGyozaDrink: "Gyoza & Drinks",
  addToCart: "Add to cart",
  soldOutBadge: "Sold out today",
  soldOutShort: "Sold out",
  soldOutHint: "Sorry, this item is not available right now.",
  signatureBadge: "House favorite · Tamon",
  photoFallback: "Photo",
  photoNoteTitle: "About photos",
  photoNoteBody:
    "Some photos on this menu are included to illustrate how dishes may be plated. We appreciate your understanding.",
  photoNoteEnOnly: null,
  tsukemenDiffTitle: "★ Tsukemen vs Tamon — only the noodles differ",
  tsukemenDiffBody:
    "Regular tsukemen is smooth and slippery. Tamon uses chewy whole-wheat noodles with more bite and flavor.",
  toppingNote: "Toppings are for ramen orders only — they cannot be ordered alone.",
  addedToCart: (name) => `Added ${name} to cart`,
  addToOrder: "Add to order",
  perItem: "/ item",
  close: "Close",
  photo: "Photo",
  orderMethod: "Dining option",
  required: "Required",
  orderMethodHint: "Please choose dine-in or takeaway.",
  dineIn: "Dine in",
  dineInSub: "Served at your table",
  takeaway: "Takeaway",
  takeawaySub: "To go",
  containerFee: "Container",
  containerFeeHint: "Required for takeaway",
  bagNeeded: "Need a plastic bag",
  bagNeededHint: "Optional",
  seat: "Seat",
  seatOptional: "(optional)",
  seatPlaceholder: "e.g. A, B, 1–8",
  pleaseChoose: "Please choose",
  beerHint: "Lager or Super Dry",
  highballHint: "Plain ¥400 / Lemon ¥450",
  beerBallHint: "Lemon, plum, or melon",
  noodleAmount: "Noodle amount",
  noodleAmountHint: "Same price · choose 150g or 200g",
  noodleAmountLarge: "Noodle amount (500g+)",
  noodleAmountLargeHint: "Choose your preferred amount.",
  toppings: "Toppings",
  toppingsHint: "Recommended extras for noodles.",
  noodleTemp: "Noodle temperature",
  noodleTempRequired: "Required",
  quickNotes: "Quick notes",
  requests: "Special requests",
  requestsOptional: "(optional)",
  requestsPlaceholder: "e.g. no greens (mizuna), no bamboo shoots (menma), etc.",
  requestsHint: "Tell us about toppings, allergies, or other requests. Leaving this blank is fine.",
  noodleTempPreset: "Noodle temperature",
  noodleTempHintRequired: "Please choose cold or hot noodles.",
  noodleTempHintOptional: "Choose your preferred noodle temperature.",
  qty: "Qty",
  addToCartBtn: "Add to cart",
  pick150200: "Please choose 150g or 200g above.",
  pickLargePortion: "Please choose a noodle amount above.",
  pickColdHot: "Please choose cold or hot noodles above.",
  pickBeer: "Please choose Lager or Super Dry above.",
  pickHighball: "Please choose Plain or Lemon above.",
  pickBeerBall: "Please choose a flavor above.",
  lager: "Lager",
  superDry: "Super Dry",
  plain: "Plain",
  lemon: "Lemon",
  plum: "Plum",
  melon: "Melon",
  coldNoodle: "Cold noodles",
  hotNoodle: "Hot noodles",
  viewCart: "View cart",
  goCheckout: "Proceed to order",
  orderProgressAria: "View order progress",
  cartEmpty: "Your cart is empty",
  cartEmptyHint: "Add items from the menu.",
  seeMenu: "Browse menu",
  backToMenu: "Back to menu",
  checkoutEyebrow: "Checkout",
  checkoutTitle: "Confirm your order",
  cartItemsCount: (n) => `${n} item${n === 1 ? "" : "s"} in cart`,
  orderContents: "Your order",
  remove: "Remove",
  howToOrder: "How to order",
  howToOrderBody: "Please scan the QR code at your table to place an order.",
  howToOrderSub: "This helps us serve you smoothly.",
  locationChecking: "Checking your location…",
  locationOutside: "Please order from inside the restaurant",
  locationOutsideHint: "Scan the QR code at your seat.",
  locationUnavailable:
    "Location unavailable. If you are in the restaurant, you can still place your order.",
  flowTitle: "How it works",
  flow1: "Scan the QR code and choose your items",
  flow2: "We prepare your order in the kitchen",
  flow3: "We’ll bring it to your table when ready",
  flow4: "Please pay at the register",
  waterTitle: "Water",
  waterBody: "Water is available at your table — help yourself.",
  guideTitle: "Need help?",
  guideBody: "Please ask a staff member anytime.",
  subtotal: "Total",
  placeOrder: "Place order",
  placeOrderAppend: "Send add-on items",
  sending: "Sending…",
  errorTitle: "Something went wrong",
  tryAgain: "Try again",
  orderDone: "Your order is complete.",
  toMenu: "Back to menu",
  appendOrder: "This is an add-on order",
  appendOrderBody:
    "Items will be added to your current order. You can track everything under the same order number.",
  mergePaid: "That order is already paid, so we’ll send this as a new order.",
  mergeCancelled: "That order was cancelled, so we’ll send this as a new order.",
  mergeTableMismatch: "Table doesn’t match the original order — sending as a new order.",
  mergeNew: "Sending as a new order.",
};

const zh: Copy = {
  menuEyebrow: "菜单",
  menuTagline: "沾面・拉面、饺子外带",
  tableLabel: "您的座位",
  tabRamen: "沾面・拉面",
  tabGyozaDrink: "饺子・饮品",
  addToCart: "加入购物车",
  soldOutBadge: "今日售罄",
  soldOutShort: "售罄",
  soldOutHint: "抱歉，该商品暂时无法点单。",
  signatureBadge: "本店人气 No.1 · 多闻",
  photoFallback: "照片",
  photoNoteTitle: "关于照片",
  photoNoteBody:
    "菜单中部分照片仅供参考摆盘效果，实际出品可能略有不同。敬请谅解。",
  photoNoteEnOnly: null,
  tsukemenDiffTitle: "★ 沾面与多闻沾面 —— 差别只在面条",
  tsukemenDiffBody:
    "普通沾面口感顺滑。多闻使用全麦面，更有嚼劲、风味更丰富。",
  toppingNote: "配料请与拉面一起点单，不可单点。",
  addedToCart: (name) => `已将 ${name} 加入购物车`,
  addToOrder: "加入订单",
  perItem: "/ 份",
  close: "关闭",
  photo: "照片",
  orderMethod: "用餐方式",
  required: "必选",
  orderMethodHint: "请选择店内用餐或外带。",
  dineIn: "店内用餐",
  dineInSub: "送到您的座位",
  takeaway: "外带",
  takeawaySub: "打包带走",
  containerFee: "餐盒费",
  containerFeeHint: "外带需使用餐盒",
  bagNeeded: "需要塑料袋",
  bagNeededHint: "可选",
  seat: "座位",
  seatOptional: "（可选）",
  seatPlaceholder: "例：A、B、1～8",
  pleaseChoose: "请选择",
  beerHint: "Lager 或 Super Dry",
  highballHint: "原味 ¥400 / 柠檬 ¥450",
  beerBallHint: "柠檬・梅子・哈密瓜（选其一）",
  noodleAmount: "面量",
  noodleAmountHint: "同价 · 请选择 150g 或 200g",
  noodleAmountLarge: "面量（500g以上）",
  noodleAmountLargeHint: "请选择您喜欢的面量。",
  toppings: "配料",
  toppingsHint: "推荐与面类一起点的追加配料。",
  noodleTemp: "面条温度",
  noodleTempRequired: "必选",
  quickNotes: "快捷备注",
  requests: "特殊要求・备注",
  requestsOptional: "（可选）",
  requestsPlaceholder: "例：不要水菜、不要笋干，等",
  requestsHint: "如有忌口、过敏或其他要求请填写。留空也可以。",
  noodleTempPreset: "面条温度",
  noodleTempHintRequired: "请选择冷面或热面。",
  noodleTempHintOptional: "请选择您喜欢的面条温度。",
  qty: "数量",
  addToCartBtn: "加入购物车",
  pick150200: "请在上方选择 150g 或 200g。",
  pickLargePortion: "请在上方选择面量。",
  pickColdHot: "请在上方选择冷面或热面。",
  pickBeer: "请在上方选择 Lager 或 Super Dry。",
  pickHighball: "请在上方选择原味或柠檬。",
  pickBeerBall: "请在上方选择口味。",
  lager: "Lager",
  superDry: "Super Dry",
  plain: "原味",
  lemon: "柠檬",
  plum: "梅子",
  melon: "哈密瓜",
  coldNoodle: "冷面",
  hotNoodle: "热面",
  viewCart: "查看购物车",
  goCheckout: "去下单",
  orderProgressAria: "查看订单进度",
  cartEmpty: "购物车是空的",
  cartEmptyHint: "请从菜单添加商品。",
  seeMenu: "查看菜单",
  backToMenu: "返回菜单",
  checkoutEyebrow: "下单",
  checkoutTitle: "确认订单",
  cartItemsCount: (n) => `购物车内 ${n} 件`,
  orderContents: "订单内容",
  remove: "删除",
  howToOrder: "下单方式",
  howToOrderBody: "请扫描座位上的二维码点单。",
  howToOrderSub: "这样可以为您更顺利地提供服务。",
  locationChecking: "正在确认位置信息…",
  locationOutside: "请在店内点单",
  locationOutsideHint: "请在座位扫描二维码使用。",
  locationUnavailable: "无法使用位置信息。若您在店内，仍可继续下单。",
  flowTitle: "使用流程",
  flow1: "扫描二维码并选择商品",
  flow2: "下单后厨房开始准备",
  flow3: "做好后会送到您的座位",
  flow4: "请在收银台付款",
  waterTitle: "关于水",
  waterBody: "座位备有饮用水，请自便。",
  guideTitle: "需要帮助？",
  guideBody: "如有疑问，请随时呼叫店员。",
  subtotal: "合计",
  placeOrder: "提交订单",
  placeOrderAppend: "提交追加内容",
  sending: "提交中…",
  errorTitle: "发生错误",
  tryAgain: "再试一次",
  orderDone: "订单已完成。",
  toMenu: "返回菜单",
  appendOrder: "这是追加订单",
  appendOrderBody: "购物车内容将合并到您当前的订单。提交后可用同一订单号追踪。",
  mergePaid: "该订单已结账，无法追加。将作为新订单提交。",
  mergeCancelled: "该订单已取消，无法追加。将作为新订单提交。",
  mergeTableMismatch: "桌号与原订单不符，将作为新订单提交。",
  mergeNew: "将作为新订单提交。",
};

const ko: Copy = {
  menuEyebrow: "메뉴",
  menuTagline: "쓰케멘・라멘, 교자 포장",
  tableLabel: "이용 좌석",
  tabRamen: "쓰케멘・라멘",
  tabGyozaDrink: "교자・음료",
  addToCart: "장바구니에 담기",
  soldOutBadge: "오늘 품절",
  soldOutShort: "품절",
  soldOutHint: "죄송합니다. 지금은 주문할 수 없습니다.",
  signatureBadge: "인기 1위 · 다몬",
  photoFallback: "사진",
  photoNoteTitle: "사진 안내",
  photoNoteBody:
    "메뉴에 실린 일부 사진은 플레이팅 예시입니다. 실제 제공과 다를 수 있으니 양해 부탁드립니다.",
  photoNoteEnOnly: null,
  tsukemenDiffTitle: "★ 쓰케멘과 다몬 쓰케멘 — 면만 다릅니다",
  tsukemenDiffBody:
    "일반 쓰케멘은 부드럽고 매끄럽습니다. 다몬은 통밀면으로 더 쫄깃하고 풍미가 풍부합니다.",
  toppingNote: "토핑은 라멘과 함께 주문해 주세요. 단품 주문은 불가합니다.",
  addedToCart: (name) => `${name}을(를) 장바구니에 담았습니다`,
  addToOrder: "주문에 추가",
  perItem: "/ 개",
  close: "닫기",
  photo: "사진",
  orderMethod: "주문 방식",
  required: "필수",
  orderMethodHint: "매장 식사 또는 포장을 선택해 주세요.",
  dineIn: "매장 식사",
  dineInSub: "좌석으로 배달",
  takeaway: "포장",
  takeawaySub: "테이크아웃",
  containerFee: "용기 비용",
  containerFeeHint: "포장 시 용기가 필요합니다",
  bagNeeded: "비닐봉투 필요",
  bagNeededHint: "선택 사항",
  seat: "좌석",
  seatOptional: "(선택)",
  seatPlaceholder: "예: A, B, 1~8",
  pleaseChoose: "선택해 주세요",
  beerHint: "Lager 또는 Super Dry",
  highballHint: "플레인 ¥400 / 레몬 ¥450",
  beerBallHint: "레몬・매실・멜론 중 하나",
  noodleAmount: "면 양",
  noodleAmountHint: "동일 가격 · 150g 또는 200g 선택",
  noodleAmountLarge: "면 양 (500g 이상)",
  noodleAmountLargeHint: "원하시는 면 양을 선택해 주세요.",
  toppings: "토핑",
  toppingsHint: "면 요리에 추천하는 추가 토핑입니다.",
  noodleTemp: "면 온도",
  noodleTempRequired: "필수",
  quickNotes: "간단 메모",
  requests: "요청・메모",
  requestsOptional: "(선택)",
  requestsPlaceholder: "예: 미즈나 빼기, 멘마 빼기 등",
  requestsHint: "토핑 제외, 알레르기 등 요청이 있으면 적어 주세요. 비워 두셔도 됩니다.",
  noodleTempPreset: "면 온도",
  noodleTempHintRequired: "차가운 면 또는 따뜻한 면을 선택해 주세요.",
  noodleTempHintOptional: "원하시는 면 온도를 선택해 주세요.",
  qty: "수량",
  addToCartBtn: "장바구니에 담기",
  pick150200: "위에서 150g 또는 200g을 선택해 주세요.",
  pickLargePortion: "위에서 면 양을 선택해 주세요.",
  pickColdHot: "위에서 차가운 면 또는 따뜻한 면을 선택해 주세요.",
  pickBeer: "위에서 Lager 또는 Super Dry를 선택해 주세요.",
  pickHighball: "위에서 플레인 또는 레몬을 선택해 주세요.",
  pickBeerBall: "위에서 맛을 선택해 주세요.",
  lager: "Lager",
  superDry: "Super Dry",
  plain: "플레인",
  lemon: "레몬",
  plum: "매실",
  melon: "멜론",
  coldNoodle: "차가운 면",
  hotNoodle: "따뜻한 면",
  viewCart: "장바구니 보기",
  goCheckout: "주문하기",
  orderProgressAria: "주문 진행 상황 보기",
  cartEmpty: "장바구니가 비어 있습니다",
  cartEmptyHint: "메뉴에서 상품을 추가해 주세요.",
  seeMenu: "메뉴 보기",
  backToMenu: "메뉴로 돌아가기",
  checkoutEyebrow: "주문",
  checkoutTitle: "주문 내용 확인",
  cartItemsCount: (n) => `장바구니 ${n}개`,
  orderContents: "주문 내용",
  remove: "삭제",
  howToOrder: "주문 방법",
  howToOrderBody: "좌석 QR 코드를 스캔해 주문해 주세요.",
  howToOrderSub: "더 원활한 서비스를 위해 필요합니다.",
  locationChecking: "위치 정보를 확인하는 중…",
  locationOutside: "매장 안에서 주문해 주세요",
  locationOutsideHint: "좌석에서 QR을 스캔해 이용해 주세요.",
  locationUnavailable:
    "위치 정보를 사용할 수 없습니다. 매장 안이라면 그대로 주문하실 수 있습니다.",
  flowTitle: "이용 안내",
  flow1: "QR을 스캔하고 메뉴를 선택하세요",
  flow2: "주문 후 주방에서 준비합니다",
  flow3: "완성되면 좌석으로 가져다 드립니다",
  flow4: "계산대에서 결제해 주세요",
  waterTitle: "물 안내",
  waterBody: "좌석에 물이 준비되어 있습니다. 자유롭게 드세요.",
  guideTitle: "도움이 필요하신가요?",
  guideBody: "궁금한 점이 있으면 직원에게 말씀해 주세요.",
  subtotal: "합계",
  placeOrder: "주문 전송",
  placeOrderAppend: "추가 내용 전송",
  sending: "전송 중…",
  errorTitle: "오류가 발생했습니다",
  tryAgain: "다시 시도",
  orderDone: "주문이 완료되었습니다.",
  toMenu: "메뉴로",
  appendOrder: "추가 주문입니다",
  appendOrderBody:
    "장바구니 내용이 현재 주문에 합쳐집니다. 전송 후 같은 주문 번호로 확인할 수 있습니다.",
  mergePaid: "해당 주문은 결제 완료되어 추가할 수 없습니다. 새 주문으로 전송됩니다.",
  mergeCancelled: "해당 주문은 취소되어 추가할 수 없습니다. 새 주문으로 전송됩니다.",
  mergeTableMismatch: "테이블 번호가 달라 새 주문으로 전송됩니다.",
  mergeNew: "새 주문으로 전송됩니다.",
};

export function customerCopy(locale: CustomerLocale): Copy {
  if (locale === "en") return en;
  if (locale === "zh") return zh;
  if (locale === "ko") return ko;
  return ja;
}
