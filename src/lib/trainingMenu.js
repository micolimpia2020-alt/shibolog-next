// 筋トレメニュー提案エンジン（training-menu-app から移植・ロジック無改変）
const DB={
  chest:[
    {id:"c1", name:"ダンベルベンチプレス",       pof:"mid",      joint:"multi",  rep:"power"},
    {id:"c2", name:"ベンチプレス",               pof:"mid",      joint:"multi",  rep:"power"},
    {id:"c10",name:"ディップス",                 pof:"stretch",  joint:"multi",  rep:"power"},
    {id:"c5", name:"ケーブルクロス",             pof:"contract", joint:"single", rep:"pump"},
    {id:"c6", name:"ペックフライ",               pof:"contract", joint:"single", rep:"pump"},
    {id:"c7", name:"手が寄るチェストマシン",     pof:"contract", joint:"single", rep:"pump"},
    {id:"c3", name:"手が寄らないチェストマシン", pof:"mid",      joint:"multi",  rep:"free"},
    {id:"c4", name:"スミスマシンベンチプレス",   pof:"mid",      joint:"multi",  rep:"free"},
    {id:"c8", name:"ダンベルフライ",             pof:"stretch",  joint:"single", rep:"free"},
    {id:"c9", name:"ダンベルプルオーバー",       pof:"stretch",  joint:"single", rep:"free"},
  ],
  back:[
    {id:"b3", name:"ケーブルプルオーバー",                direction:"upper", rep:"power"},
    {id:"b7", name:"ダンベルワンハンドローイング",        direction:"front", rep:"power"},
    {id:"b8", name:"デッドリフト",                        direction:"lower", rep:"power"},
    {id:"b9", name:"Tバーロー",                           direction:"lower", rep:"power"},
    {id:"b10",name:"ベントオーバーロー",                  direction:"lower", rep:"power"},
    {id:"b1", name:"ラットプル（ワイド/ナロー/パラレル）",direction:"upper", rep:"pump"},
    {id:"b2", name:"チンニング（ワイド/パラレル）",       direction:"upper", rep:"pump"},
    {id:"b5", name:"マシンロー",                          direction:"front", rep:"pump"},
    {id:"b6", name:"シールロー",                          direction:"front", rep:"pump"},
    {id:"b4", name:"ケーブルローイング",                  direction:"front", rep:"free"},
  ],
  shoulder:[
    {id:"s1", name:"ショルダープレス（スミス/ダンベル/バーベル）",zone:"front",joint:"multi",  rep:"power"},
    {id:"s10",name:"フェイスプル",                                zone:"rear", joint:"multi",  rep:"power"},
    {id:"s3", name:"フロントレイズ（ケーブル/ダンベル）",        zone:"front",joint:"single", rep:"pump"},
    {id:"s4", name:"サイドレイズ（ダンベル/ケーブル）",          zone:"side", joint:"single", rep:"pump"},
    {id:"s5", name:"インクラインサイドレイズ",                    zone:"side", joint:"single", rep:"pump"},
    {id:"s6", name:"アップライトロウ",                            zone:"side", joint:"multi",  rep:"pump"},
    {id:"s7", name:"ラテラルレイズマシン",                        zone:"side", joint:"single", rep:"pump"},
    {id:"s8", name:"ペックデックリア",                            zone:"rear", joint:"single", rep:"pump"},
    {id:"s9", name:"リアレイズ（ダンベル/ケーブル）",            zone:"rear", joint:"single", rep:"pump"},
    {id:"s2", name:"ミリタリープレス",                            zone:"front",joint:"multi",  rep:"free"},
  ],
  bicep:[
    {id:"bi1",name:"バーベルカール（EZbar/ストレートbar）",pof:"mid",     joint:"multi",  rep:"power"},
    {id:"bi2",name:"オルタネイトカール（逆手/ハンマー）", pof:"mid",     joint:"multi",  rep:"power"},
    {id:"bi3",name:"コンセントレーションカール",          pof:"contract",joint:"single", rep:"pump"},
    {id:"bi4",name:"ドラッグカール",                      pof:"contract",joint:"single", rep:"pump"},
    {id:"bi5",name:"スパイダーカール",                    pof:"contract",joint:"single", rep:"pump"},
    {id:"bi6",name:"インクラインカール",                  pof:"stretch", joint:"single", rep:"free"},
  ],
  tricep:[
    {id:"tr1",name:"ナローベンチプレス",           pof:"mid",     joint:"multi",  rep:"power"},
    {id:"tr5",name:"フレンチプレス",               pof:"stretch", joint:"single", rep:"power"},
    {id:"tr3",name:"キックバック",                 pof:"contract",joint:"single", rep:"pump"},
    {id:"tr4",name:"ケーブルプレスダウン",         pof:"contract",joint:"single", rep:"pump"},
    {id:"tr6",name:"ケーブルオーバーヘッドプレス", pof:"stretch", joint:"single", rep:"pump"},
    {id:"tr2",name:"ライイングエクステンション",   pof:"mid",     joint:"multi",  rep:"free"},
  ],
  leg_quad:[
    {id:"lm1",name:"スクワット（バーベル/スミス）",        joint:"multi",  rep:"power"},
    {id:"lm2",name:"レッグプレス（ウェイトスタック/45°）", joint:"multi",  rep:"power"},
    {id:"lm3",name:"ハックスクワット",                     joint:"multi",  rep:"power"},
    {id:"ls3",name:"アウターサイ（四頭）",                 joint:"single", rep:"power"},
    {id:"ls1",name:"レッグエクステンション",               joint:"single", rep:"pump"},
    {id:"ls4",name:"シシースクワット",                     joint:"single", rep:"pump"},
    {id:"ls2",name:"インナーサイ",                         joint:"single", rep:"pump"},
  ],
  leg_hamglute:[
    {id:"lh3",name:"ルーマニアンデッド",    joint:"multi",  rep:"power"},
    {id:"lg1",name:"ブルガリアンスクワット",joint:"multi",  rep:"power"},
    {id:"lg2",name:"アウターサイ（ハム）",  joint:"single", rep:"power"},
    {id:"lg3",name:"ヒップスラスト",        joint:"multi",  rep:"power"},
    {id:"lh1",name:"レッグカール",          joint:"single", rep:"pump"},
    {id:"lh2",name:"シーテッドレッグカール",joint:"single", rep:"pump"},
    {id:"lc1",name:"カーフレイズ",          joint:"single", rep:"free"},
  ],
};

// 脚統合プール（leg_quad + leg_hamglute）
const LEG_ALL=[...DB.leg_quad,...DB.leg_hamglute];

const REP_LABEL={power:"8〜10",pump:"15〜20",free:"8〜20"};
const REP_CLASS={power:"rep-badge rep-power",pump:"rep-badge rep-pump",free:"rep-badge rep-free"};
const POF_L={mid:"ミッドレンジ",stretch:"ストレッチ",contract:"コントラクト"};
const DIR_L={upper:"上引き",front:"前引き",lower:"下引き"};
const ZON_L={front:"フロント",side:"サイド",rear:"リア"};
const PRT_L={chest:"胸",back:"背中",shoulder:"肩",bicep:"二頭筋",tricep:"三頭筋",arm:"腕",leg_quad:"脚①（四頭筋）",leg_hamglute:"脚②（ハムケツ・カーフ）",leg:"脚"};

const FULLBODY_ORDER_SPLIT=["chest","back","shoulder","arm","leg_quad","leg_hamglute"];
const FULLBODY_ORDER_MERGE=["chest","back","shoulder","arm","leg"];

const FOCUS_PARTS=[
  {k:"chest",       l:"胸"},
  {k:"back",        l:"背中"},
  {k:"shoulder",    l:"肩"},
  {k:"bicep",       l:"二頭筋"},
  {k:"tricep",      l:"三頭筋"},
  {k:"leg_quad",    l:"脚①（四頭筋）"},
  {k:"leg_hamglute",l:"脚②（ハムケツ・カーフ）"},
];

const GOALS=[
  {k:"fullbody",       l:"全身くまなく",    d:"全部位をバランスよく"},
  {k:"fullbody_focus", l:"全身＋特化2部位", d:"全身ベースに強化部位を優先"},
  {k:"focus",          l:"部位選択",        d:"選んだ部位だけをローテーション"},
];

// ユーティリティ
// ============================================================
const rnd=a=>a[Math.floor(Math.random()*a.length)];

const pofPick=xs=>({
  mid:    rnd(xs.filter(e=>e.pof==="mid")),
  stretch:rnd(xs.filter(e=>e.pof==="stretch")),
  contract:rnd(xs.filter(e=>e.pof==="contract")),
});

const ordByJoint=(xs,v)=>{
  const m=xs.filter(e=>e.joint==="multi");
  const s=xs.filter(e=>e.joint==="single");
  return v==="power"?[...m,...s]:[...s,...m];
};

const pickExtra=(pool,usedIds,v)=>{
  const unused=pool.filter(e=>!usedIds.has(e.id));
  if(!unused.length)return null;
  const preferred=unused.filter(e=>v==="power"?e.joint==="multi":e.joint==="single");
  return rnd(preferred.length?preferred:unused);
};

// 部位→種目生成
const buildBase=(part,v)=>{
  let base=[];

  if(part==="chest"){
    base=ordByJoint(Object.values(pofPick(DB.chest)),v);
    const extra=pickExtra(DB.chest,new Set(base.map(e=>e.id)),v);
    if(extra)base=[...base,extra];
    return base;
  }

  if(part==="back"){
    base=[
      rnd(DB.back.filter(e=>e.direction==="upper")),
      rnd(DB.back.filter(e=>e.direction==="front")),
      rnd(DB.back.filter(e=>e.direction==="lower")),
    ];
    const extra=pickExtra(DB.back,new Set(base.map(e=>e.id)),v);
    if(extra)base=[...base,extra];
    return base;
  }

  if(part==="shoulder"){
    base=ordByJoint([
      rnd(DB.shoulder.filter(e=>e.zone==="front")),
      rnd(DB.shoulder.filter(e=>e.zone==="side")),
      rnd(DB.shoulder.filter(e=>e.zone==="rear")),
    ],v);
    const extra=pickExtra(DB.shoulder,new Set(base.map(e=>e.id)),v);
    if(extra)base=[...base,extra];
    return base;
  }

  if(part==="bicep"){
    // 二頭：2種目（mid1 + contract or stretch 1）
    const mid=rnd(DB.bicep.filter(e=>e.pof==="mid"));
    const rest=rnd(DB.bicep.filter(e=>e.pof!=="mid"&&e.id!==mid.id));
    return ordByJoint([mid,rest].filter(Boolean),v);
  }

  if(part==="tricep"){
    // 三頭：2種目（mid1 + contract or stretch 1）
    const mid=rnd(DB.tricep.filter(e=>e.pof==="mid"));
    const rest=rnd(DB.tricep.filter(e=>e.pof!=="mid"&&e.id!==mid.id));
    return ordByJoint([mid,rest].filter(Boolean),v);
  }

  if(part==="arm"){
    // 腕：二頭2種目＋三頭2種目＝計4種目
    return[...buildBase("bicep",v),...buildBase("tricep",v)];
  }

  if(part==="leg_quad"){
    const multi=rnd(DB.leg_quad.filter(e=>e.joint==="multi"));
    const single=rnd(DB.leg_quad.filter(e=>e.joint==="single"));
    base=v==="power"?[multi,single]:[single,multi];
    const extra=pickExtra(DB.leg_quad,new Set(base.map(e=>e.id)),v);
    if(extra)base=[...base,extra];
    return base;
  }

  if(part==="leg_hamglute"){
    const ham=rnd(DB.leg_hamglute.filter(e=>e.id.startsWith("lh")));
    const glute=rnd(DB.leg_hamglute.filter(e=>e.id.startsWith("lg")));
    const calf=rnd(DB.leg_hamglute.filter(e=>e.id.startsWith("lc")));
    return[ham,glute,calf];
  }

  if(part==="leg"){
    // 脚統合：①から2種目＋②から2種目＝計4種目
    const quadMulti=rnd(DB.leg_quad.filter(e=>e.joint==="multi"));
    const quadSingle=rnd(DB.leg_quad.filter(e=>e.joint==="single"));
    const ham=rnd(DB.leg_hamglute.filter(e=>e.id.startsWith("lh")));
    const glute=rnd(DB.leg_hamglute.filter(e=>e.id.startsWith("lg")||e.id.startsWith("lc")));
    const quad=v==="power"?[quadMulti,quadSingle]:[quadSingle,quadMulti];
    return[...quad,ham,glute];
  }

  return base;
};

// 追加種目のプールを返す（統合脚はLEG_ALL）
const getPool=(part)=>{
  if(part==="leg")return LEG_ALL;
  if(part==="arm")return[...DB.bicep,...DB.tricep];
  return DB[part]||[];
};

// ============================================================
// スプリット生成
// ============================================================
const mkSplit=(count,goal,f1,f2)=>{
  // 10回以下は脚を統合、11回以上は分割
  const mergeLeg=count<=10;

  let baseOrder;
  if(goal==="fullbody"){
    baseOrder=mergeLeg?FULLBODY_ORDER_MERGE:FULLBODY_ORDER_SPLIT;
  } else if(goal==="fullbody_focus"){
    const fullOrder=mergeLeg?FULLBODY_ORDER_MERGE:FULLBODY_ORDER_SPLIT;
    const rest=fullOrder.filter(p=>p!==f1&&p!==f2);
    baseOrder=[f1,f2&&f2!==f1?f2:null,...rest].filter(Boolean);
  } else {
    // 部位選択：脚系が両方選ばれていてmergeLegなら統合
    let parts=[f1,f2&&f2!==f1?f2:null].filter(Boolean);
    if(mergeLeg){
      const hasQuad=parts.includes("leg_quad");
      const hasHam=parts.includes("leg_hamglute");
      if(hasQuad&&hasHam){
        parts=parts.filter(p=>p!=="leg_quad"&&p!=="leg_hamglute");
        parts.push("leg");
      }
    }
    baseOrder=parts;
  }

  return Array.from({length:count},(_,i)=>({
    dayNumber:i+1,
    part:baseOrder[i%baseOrder.length],
    isFocus1:baseOrder[i%baseOrder.length]===f1,
    isFocus2:baseOrder[i%baseOrder.length]===f2,
  }));
};


export {
  DB, LEG_ALL, REP_LABEL, POF_L, DIR_L, ZON_L,
  FULLBODY_ORDER_SPLIT, FULLBODY_ORDER_MERGE, FOCUS_PARTS, GOALS,
  buildBase, getPool, mkSplit, pickExtra,
};
export const PART_L = { chest: "胸", back: "背中", shoulder: "肩", bicep: "二頭筋", tricep: "三頭筋", arm: "腕", leg_quad: "脚①（四頭筋）", leg_hamglute: "脚②（ハムケツ・カーフ）", leg: "脚" };
export const REP_COLORS = { power: "#9C8B6E", pump: "#8BA84A", free: "" };
export const getTag = (ex) => {
  if (ex.pof) return POF_L[ex.pof] || "";
  if (ex.direction) return DIR_L[ex.direction] || "";
  if (ex.zone) return ZON_L[ex.zone] || "";
  return "";
};
