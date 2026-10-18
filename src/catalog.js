export const SUBJECTS = [
  { id:'cataract', name:'白内障', en:'CATARACT', icon:'sun', description:'IOL・手術手技・術後合併症', evidence:'2025・2024白内障問題と解答、Excel「白内障」', refs:['cataract'] },
  { id:'cornea', name:'角結膜', en:'CORNEA', icon:'layers', description:'眼表面・感染症・角膜移植', evidence:'2023角膜問題、2025角膜解説・クルズス', refs:['keratitis','dryeye'] },
  { id:'glaucoma', name:'緑内障', en:'GLAUCOMA', icon:'focus', description:'隅角・視野・点眼・術後管理', evidence:'2025緑内障問題、2024・2025再現記録、Excel「緑内障」', refs:['glaucoma'] },
  { id:'retina-surgery', name:'網膜外科', en:'VITREORETINAL', icon:'scissors', description:'網膜剥離・硝子体手術・タンポナーデ', evidence:'網膜外科「試験対策」、2024・2025再現記録', refs:[] },
  { id:'retina-medical', name:'網膜内科', en:'MEDICAL RETINA', icon:'waves', description:'AMD・RP・ERG・遺伝性網膜疾患', evidence:'Excel「網膜内科」、2024・2025再現記録', refs:['amd','rp','erg','stargardt'] },
  { id:'uveitis', name:'ぶどう膜', en:'UVEITIS', icon:'spark', description:'画像所見・鑑別・炎症の治療', evidence:'2023ぶどう膜問題と採点基準、2024解答、2025再現記録、Excel「ぶどう膜」', refs:['uveitis'] },
  { id:'pediatric', name:'小児斜視', en:'PEDIATRIC', icon:'smile', description:'弱視・眼位・ROP・FEVR', evidence:'Excel「小児斜視」、2024・2025再現記録', refs:['rop','amblyopia'] },
  { id:'neuro', name:'神経', en:'NEURO-OPHTHALMOLOGY', icon:'network', description:'瞳孔・視神経炎・眼球運動', evidence:'Excel「神経」、2024・2025再現記録', refs:['opticneuritis','aqp4'] }
];

export const REFERENCES = {
  trabeculectomy:{title:'AIOS：Trabeculectomy — 術後合併症と管理（2022）',url:'https://aios-scientificcommittee.org/wp-content/uploads/2026/04/Trabeculectomy.pdf'},
  suturelysis:{title:'レーザー切糸の効果・実施時期に関する臨床研究（2016）',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5084496/'},
  cornealtransplant:{title:'AAO：Cornea講習資料・角膜移植（2021）',url:'https://cdn.aao.org/pdf/AAOSub_2021_COR_Syllabus.pdf'},
  retinaldetachment:{title:'ASRS：Retinal Detachment',url:'https://www.asrs.org/patients/retinal-diseases/6/retinal-detachment'},
  diabeticlaser:{title:'NEI：糖尿病網膜症のレーザー治療',url:'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/diabetic-retinopathy/laser-treatment-diabetic-retinopathy'},
  ergstandard:{title:'ISCEV：全視野ERG標準（2022・本文）',url:'https://link.springer.com/content/pdf/10.1007/s10633-022-09872-0.pdf'},
  choroideremia:{title:'GeneReviews：Choroideremia',url:'https://www.ncbi.nlm.nih.gov/books/NBK1337/'},
  lymphoma:{title:'硝子体網膜リンパ腫の診断に関する国際コンセンサス（2021）',url:'https://pubmed.ncbi.nlm.nih.gov/34009095/'},
  hbv:{title:'日本肝臓学会：B型肝炎治療ガイドライン',url:'https://www.jsh.or.jp/medical/guidelines/jsh_guidlines/hepatitis_b.html'},
  icrop:{title:'未熟児網膜症の国際分類 第3版（ICROP3・2021）',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10979521/'},
  aaposrop:{title:'AAPOS：Retinopathy of Prematurity',url:'https://www.aapos.org/glossary/retinopathy-of-prematurity'},
  accommodative:{title:'AAPOS：Accommodative Esotropia',url:'https://www.aapos.org/glossary/accommodative-esotropia'},
  pfv:{title:'AAPOS：Persistent Fetal Vasculature',url:'https://aapos.org/glossary/persistent-fetal-vasculature-pfv'},
  coats:{title:'AAPOS：Coats’ Disease',url:'https://www.aapos.org/glossary/coats-disease'},
  opticconsensus:{title:'視神経炎の診断・管理に関するコンセンサス',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC13485077/'},
  nmosd:{title:'NMOSDの国際診断基準（2015）',url:'https://www.neurology.org/doi/10.1212/wnl.0000000000001729'},
  ischemic:{title:'NANOS：非動脈炎性前部虚血性視神経症',url:'https://www.nanosweb.org/i4a/pages/index.cfm?pageid=4196'},
  gca:{title:'NANOS：Giant Cell Arteritis',url:'https://www.nanosweb.org/GiantCellArteritis/'},
  mg:{title:'NANOS：Myasthenia Gravis',url:'https://www.nanosweb.org/MyastheniaGravis/'},
  thirdnerve:{title:'NANOS：2019講習資料・動眼神経麻痺の画像診断',url:'https://www.nanosweb.org/files/Annual%20Meeting%27/2019/2019%20NANOS%20Final%20Syllabus%281%29.pdf'},
  cataract:{title:'日本白内障屈折矯正手術学会',url:'https://www.jscrs.org/',note:'設問の直接の根拠は提供された2024・2025問題・解答。学会の入口リンク。'},
  keratitis:{title:'感染性角膜炎診療ガイドライン 第3版（2023）',url:'https://www.nichigan.or.jp/Portals/0/resources/member/guideline/infectious_keratitis_3rd.pdf'},
  dryeye:{title:'ドライアイ診療ガイドライン（2019）',url:'https://www.nichigan.or.jp/Portals/0/resources/member/guideline/dryeye_guideline.pdf'},
  glaucoma:{title:'緑内障診療ガイドライン 第5版（2022）',url:'https://www.nichigan.or.jp/Portals/0/resources/member/guideline/glaucoma5th.pdf'},
  amd:{title:'新生血管型加齢黄斑変性の診療ガイドライン（2024）',url:'https://www.nichigan.or.jp/Portals/0/resources/member/guideline/nvAMD.pdf'},
  rp:{title:'網膜色素変性診療ガイドライン2026',url:'https://www.nichigan.or.jp/member/journal/guideline/detail.html?dispmid=909&itemid=921'},
  erg:{title:'ISCEV：全視野ERG標準（2022）',url:'https://www.iscev.org/standards/'},
  stargardt:{title:'National Eye Institute：Stargardt disease',url:'https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/stargardt-disease'},
  uveitis:{title:'ぶどう膜炎診療ガイドライン（2019・旧版）',url:'https://www.nichigan.or.jp/Portals/0/resources/member/guideline/uveitis_guideline.pdf',note:'2026年に第2版の案内あり。全文未確認のため第2版に準拠したとの保証はしない。設問は提供解答と基礎事項を中心に編集。'},
  rop:{title:'未熟児網膜症に対する抗VEGF療法の手引き 第2版（2023）',url:'https://www.nichigan.or.jp/member/journal/guideline/detail.html?dispmid=909&itemid=628'},
  amblyopia:{title:'AAPOS：Amblyopia',url:'https://www.aapos.org/glossary/amblyopia'},
  opticneuritis:{title:'NANOS：Optic Neuritis',url:'https://www.nanosweb.org/opticNeuritis/'},
  aqp4:{title:'日本眼科学会：視神経症（視神経炎）',url:'https://www.nichigan.or.jp/public/disease/name.html?pdid=32'}
};

export const EDITORIAL_NOTES = [
  '8科目は提供Excelのシート構成に準拠。オリジナル問題は提供資料・2024/2025再現記録のテーマから展開しています。出題予測や網羅性を保証するものではありません。',
  '「過去問」は一問一答に分割・再構成しています。「再現記録」は提供された記録を基にした文章問題で、元の出題画像がないものです。原画像を作り替えたり、架空の過去問画像を生成したりしていません。',
  'AMDのメモは補正：1型はRPE下（旧occultに対応することが多い）、2型は網膜下（旧classicに対応することが多い）、3型は網膜内血管系由来。旧FA分類との完全な同義ではありません。',
  'ベンチュリの実流量は常に一定ではありません。分散型OVDも残留すれば眼圧上昇の原因になります。資料の断定的な表現は補正しています。',
  '「ヒトヘルペスウイルスは20型」の記載は採用していません。ROPスクリーニングやMOG関連炎の治療期間を、提供メモの数値だけで全例共通の基準にはしていません。',
  '公式解答を含まない緑内障などには編集上の参考解答を付けています。各解説に照合状況を表示します。問題文・解説は自習用に編集したもので、専門医による全問査読は未実施です。',
  '原本・採点表・名簿・患者IDを含む検査画面は配信していません。画像は提供資料から学習に必要な範囲を抽出したものです。資料の著作権は各権利者に帰属します。'
];
