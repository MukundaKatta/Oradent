'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Printer,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type ArticleCategory = 'Post-Op Instructions' | 'Prevention' | 'Oral Hygiene' | 'Treatment Info';

interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  content: string;
}

// ═══════════════════ CONSTANTS ═══════════════════

const CATEGORIES: ArticleCategory[] = [
  'Post-Op Instructions',
  'Prevention',
  'Oral Hygiene',
  'Treatment Info',
];

const CATEGORY_CONFIG: Record<
  ArticleCategory,
  { color: string; bgColor: string; icon: typeof BookOpen }
> = {
  'Post-Op Instructions': {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-50',
    icon: HeartPulse,
  },
  Prevention: {
    color: 'bg-green-100 text-green-700 border-green-200',
    bgColor: 'bg-green-50',
    icon: ShieldCheck,
  },
  'Oral Hygiene': {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
    icon: Sparkles,
  },
  'Treatment Info': {
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    bgColor: 'bg-teal-50',
    icon: Stethoscope,
  },
};

const ARTICLES: Article[] = [
  {
    id: 'post-extraction',
    title: 'After a Tooth Extraction',
    category: 'Post-Op Instructions',
    content: `Following a tooth extraction, proper care is essential for healing. Bite on the gauze pad firmly for 30-45 minutes after the procedure. Do not rinse, spit, or use a straw for the first 24 hours. After 24 hours, gently rinse with warm salt water (1/2 teaspoon of salt in 8 ounces of water) several times a day. Avoid smoking for at least 72 hours as it can delay healing and increase the risk of dry socket. Eat soft foods such as yogurt, pudding, and applesauce. Gradually add solid foods as the extraction site heals. Take prescribed pain medication as directed. Apply ice packs to the outside of your cheek for 10 minutes on, 20 minutes off to reduce swelling. Contact our office if you experience excessive bleeding, severe pain after 2-3 days, or signs of infection such as fever or pus.`,
  },
  {
    id: 'post-filling',
    title: 'After a Dental Filling',
    category: 'Post-Op Instructions',
    content: `After receiving a dental filling, it is normal to experience some sensitivity to hot, cold, and pressure for a few days to a few weeks. If local anesthesia was used, avoid chewing on the numb side until the numbness wears off completely to prevent biting your cheek or tongue. For composite (tooth-colored) fillings, you may eat immediately. For amalgam (silver) fillings, wait at least 24 hours before chewing on the restored tooth. If your bite feels uneven or high, please call our office for an adjustment. Maintain your regular brushing and flossing routine. Over-the-counter pain relievers such as ibuprofen can help manage any discomfort. If sensitivity persists beyond two weeks or pain increases, please contact our office.`,
  },
  {
    id: 'post-crown',
    title: 'After Crown or Bridge Placement',
    category: 'Post-Op Instructions',
    content: `If a temporary crown was placed, avoid sticky or hard foods on that side. The temporary is held in place with temporary cement and can come loose. If it does come off, clean it and try to reposition it using over-the-counter dental adhesive or toothpaste, and call our office. For permanent crowns, it is normal to experience some sensitivity for a few days. Avoid extremely hard or sticky foods for the first 24 hours. Continue to brush and floss normally, but be gentle around the new crown. Use a floss threader or interdental brush to clean under bridges. It may take a few days for your bite to feel natural. If the bite feels significantly off after a week, call for an adjustment.`,
  },
  {
    id: 'fluoride-benefits',
    title: 'Benefits of Fluoride Treatment',
    category: 'Prevention',
    content: `Fluoride is a natural mineral that helps prevent tooth decay by strengthening tooth enamel. Professional fluoride treatments at our office provide a much higher concentration than what is found in toothpaste or water. Benefits include: strengthening developing teeth in children, reversing early signs of tooth decay, reducing the amount of acid produced by bacteria on teeth, and providing a protective barrier on enamel. We recommend fluoride treatments every 6 months during your regular cleaning appointments. For patients at higher risk for cavities, more frequent applications may be beneficial. At home, use fluoride toothpaste and consider a fluoride rinse if recommended by your dentist.`,
  },
  {
    id: 'sealants',
    title: 'Dental Sealants for Cavity Prevention',
    category: 'Prevention',
    content: `Dental sealants are thin, protective coatings applied to the chewing surfaces of back teeth (molars and premolars) where most cavities form. The sealant material bonds into the grooves and depressions of teeth, forming a shield over the enamel. Sealants are most commonly applied to children's permanent molars as soon as they come in, typically between ages 6-12. However, adults without decay or fillings in their molars can also benefit. The application is quick, painless, and requires no anesthesia. Sealants can protect teeth from decay for up to 10 years with proper care. They should be checked at regular dental visits and can be reapplied if worn. Studies show sealants reduce the risk of decay in molars by nearly 80%.`,
  },
  {
    id: 'oral-cancer-screening',
    title: 'Importance of Oral Cancer Screening',
    category: 'Prevention',
    content: `Oral cancer screening is a routine part of your dental examination. Early detection significantly improves treatment outcomes. During a screening, we examine your mouth, throat, tongue, cheeks, and gums for any signs of abnormalities such as red or white patches, sores that do not heal within two weeks, lumps or thickened areas, and difficulty swallowing or persistent hoarseness. Risk factors include tobacco use, excessive alcohol consumption, prolonged sun exposure to the lips, HPV infection, and a history of oral cancer. We recommend screenings at every dental visit. If you notice any unusual changes in your mouth between visits, do not wait for your next appointment -- contact us immediately.`,
  },
  {
    id: 'brushing-technique',
    title: 'Proper Brushing Technique',
    category: 'Oral Hygiene',
    content: `Proper brushing technique is essential for maintaining oral health. Use a soft-bristled toothbrush and fluoride toothpaste. Hold the brush at a 45-degree angle to your gums. Use gentle, short, tooth-wide strokes, moving the brush back and forth. Brush the outer surfaces, inner surfaces, and chewing surfaces of all teeth. For the inside surfaces of front teeth, tilt the brush vertically and make several up-and-down strokes. Brush your tongue to remove bacteria and freshen breath. Brush for a full two minutes, twice a day. Replace your toothbrush every 3-4 months, or sooner if bristles are frayed. Consider using an electric toothbrush, which can be more effective at removing plaque. Do not brush too hard, as this can damage gums and enamel.`,
  },
  {
    id: 'flossing-guide',
    title: 'Complete Guide to Flossing',
    category: 'Oral Hygiene',
    content: `Flossing removes plaque and food particles from between teeth where your toothbrush cannot reach. Use about 18 inches of floss, winding most around one middle finger and the rest around the opposite middle finger. Hold the floss tightly between your thumbs and forefingers with about one inch between them. Guide the floss between teeth using a gentle rubbing motion. When the floss reaches the gum line, curve it into a C-shape against one tooth. Slide it gently between the gum and tooth. Hold the floss tightly against the tooth and rub the side, moving away from the gum with up-and-down motions. Repeat on the adjacent tooth. Floss at least once daily. If traditional floss is difficult, try floss picks, water flossers, or interdental brushes. Never force the floss, as this can damage delicate gum tissue.`,
  },
  {
    id: 'mouthwash-guide',
    title: 'Choosing and Using Mouthwash',
    category: 'Oral Hygiene',
    content: `Mouthwash can be a valuable addition to your oral hygiene routine, but it should not replace brushing and flossing. Therapeutic mouthwashes contain active ingredients that help control or reduce plaque, gingivitis, bad breath, and tooth decay. Look for products with the ADA Seal of Acceptance. Fluoride rinses help prevent tooth decay. Antiseptic rinses containing cetylpyridinium chloride or essential oils help reduce plaque and gingivitis. Use mouthwash after brushing and flossing for maximum benefit. Swish for 30-60 seconds and avoid eating or drinking for 30 minutes afterward. Do not give mouthwash to children under 6, as they may swallow it. If you experience persistent dry mouth, avoid alcohol-based mouthwashes and consider a moisturizing rinse instead.`,
  },
  {
    id: 'root-canal-info',
    title: 'Understanding Root Canal Treatment',
    category: 'Treatment Info',
    content: `A root canal treatment (endodontic therapy) is needed when the pulp inside a tooth becomes infected or damaged. This can happen due to deep decay, repeated dental procedures, cracks, or trauma. Symptoms may include severe toothache, prolonged sensitivity to heat or cold, darkening of the tooth, swelling, and tenderness in nearby gums. During the procedure, the infected pulp is removed, the canal is cleaned and shaped, and then filled and sealed. A crown is usually placed afterward to protect and restore the tooth. Modern root canal treatment is similar to a routine filling and can usually be completed in one or two appointments. With proper care, a root canal treated tooth can last a lifetime. The procedure has a success rate of over 95%.`,
  },
  {
    id: 'teeth-whitening',
    title: 'Professional Teeth Whitening Options',
    category: 'Treatment Info',
    content: `Professional teeth whitening is a safe and effective way to brighten your smile. We offer both in-office and take-home whitening options. In-office whitening uses a high-concentration bleaching gel activated by a special light, providing dramatic results in about one hour. Take-home whitening uses custom-fitted trays with professional-grade whitening gel, worn for 30 minutes to several hours daily for 1-2 weeks. Results vary depending on the type and severity of staining. Intrinsic stains from medications or trauma may not respond as well as extrinsic stains from coffee, tea, wine, or tobacco. Common side effects include temporary tooth sensitivity and mild gum irritation. To maintain your results, avoid staining foods and beverages, do not smoke, and practice good oral hygiene. Touch-up treatments may be needed periodically.`,
  },
  {
    id: 'dental-implants',
    title: 'Dental Implants: What to Expect',
    category: 'Treatment Info',
    content: `Dental implants are titanium posts surgically placed into the jawbone to serve as artificial tooth roots. They provide a strong foundation for permanent or removable replacement teeth. The process typically involves several stages over 3-6 months: initial consultation and planning with 3D imaging, implant placement surgery, a healing period of 3-6 months for osseointegration (bone fusing with the implant), abutment placement, and final crown or prosthesis attachment. Candidates for implants should have healthy gums, adequate bone to support the implant, and be committed to good oral hygiene. Success rates are above 95% for most patients. With proper care, dental implants can last a lifetime. They look, feel, and function like natural teeth and help preserve jawbone structure that would otherwise deteriorate after tooth loss.`,
  },
];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function ResourcesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | ''>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredArticles = useMemo(() => {
    let result = ARTICLES;
    if (categoryFilter) {
      result = result.filter((a) => a.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, categoryFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrint = (article: Article) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${article.title}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #333; line-height: 1.7; }
            h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
            .category { font-size: 14px; color: #666; margin-bottom: 24px; display: block; }
            .content { font-size: 16px; white-space: pre-wrap; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>${article.title}</h1>
          <span class="category">${article.category}</span>
          <div class="content">${article.content}</div>
          <div class="footer">Patient Education Resource - Printed from Oradent Dental Practice Management</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Patient Education Resources</h1>
        <p className="mt-1 text-sm text-stone-500">
          Dental education articles for patient care and post-operative instructions
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
          <button
            onClick={() => setCategoryFilter('')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === ''
                ? 'bg-teal-600 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                categoryFilter === cat
                  ? 'bg-teal-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-stone-500">
        {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} found
      </p>

      {/* Articles */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-sm font-medium text-stone-700">No articles found</h3>
          <p className="mt-1 text-xs text-stone-500">
            Try adjusting your search or category filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const isExpanded = expandedIds.has(article.id);
            const config = CATEGORY_CONFIG[article.category];
            const Icon = config.icon;

            return (
              <div
                key={article.id}
                className="rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => toggleExpand(article.id)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-lg p-2', config.bgColor)}>
                      <Icon className="h-5 w-5 text-stone-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900">
                        {article.title}
                      </h3>
                      <span
                        className={cn(
                          'mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                          config.color
                        )}
                      >
                        {article.category}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-stone-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-stone-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-100 px-5 py-4">
                    <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                      {article.content}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handlePrint(article)}
                        className="flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
                      >
                        <Printer className="h-4 w-4" />
                        Print Article
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
