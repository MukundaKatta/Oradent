'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  BookOpen,
  Shield,
  Sparkles,
  HeartPulse,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  summary: string;
  content: string;
}

type ResourceCategory = 'Post-Op Instructions' | 'Prevention' | 'Treatment Info' | 'Oral Hygiene';

const CATEGORY_CONFIG: Record<
  ResourceCategory,
  { icon: typeof BookOpen; color: string; bgColor: string }
> = {
  'Post-Op Instructions': {
    icon: HeartPulse,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  Prevention: {
    icon: Shield,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
  },
  'Treatment Info': {
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  'Oral Hygiene': {
    icon: BookOpen,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
  },
};

// ═══════════════════ CONTENT DATA ═══════════════════

const RESOURCES: Resource[] = [
  {
    id: 'after-extraction',
    title: 'After Tooth Extraction',
    category: 'Post-Op Instructions',
    summary: 'Care instructions following a tooth extraction procedure.',
    content: `After your tooth extraction, proper care is essential for healing. Here are important instructions to follow:

Immediately After:
- Bite down gently on the gauze pad placed by your dentist for 30-45 minutes.
- Do not spit, rinse, or use a straw for the first 24 hours. This can dislodge the blood clot.
- Apply an ice pack to the outside of your cheek for 10 minutes on, 10 minutes off to reduce swelling.

First 24 Hours:
- Eat soft foods such as yogurt, pudding, and applesauce.
- Avoid hot foods and beverages.
- Do not smoke or use tobacco products, as this can delay healing and cause dry socket.
- Take prescribed pain medication as directed.

After 24 Hours:
- Gently rinse with warm salt water (1/2 teaspoon salt in 8 oz water) after meals and before bed.
- Brush your teeth carefully, avoiding the extraction site.
- Continue eating soft foods and gradually return to your normal diet as comfort allows.

When to Call Us:
- Excessive bleeding that does not subside with pressure
- Severe pain not relieved by medication
- Swelling that worsens after 2-3 days
- Fever over 101 degrees F
- Numbness that persists beyond 24 hours`,
  },
  {
    id: 'after-root-canal',
    title: 'After Root Canal Treatment',
    category: 'Post-Op Instructions',
    summary: 'Post-procedure care following root canal therapy.',
    content: `After your root canal treatment, you may experience some sensitivity. Follow these guidelines for a smooth recovery:

Immediately After:
- Avoid eating until the numbness wears off completely to prevent biting your cheek or tongue.
- Some tenderness is normal and may last 2-3 days.

Pain Management:
- Take over-the-counter pain relievers (ibuprofen or acetaminophen) as directed.
- If antibiotics were prescribed, complete the full course even if symptoms improve.

Eating and Drinking:
- Avoid chewing on the treated tooth until a permanent restoration (crown) is placed.
- Stick to softer foods for the first few days.
- Avoid extremely hot or cold beverages.

Oral Hygiene:
- Continue your normal brushing and flossing routine.
- Be gentle around the treated area.

Follow-Up:
- Schedule your follow-up appointment for a permanent crown or restoration.
- Delaying the permanent restoration can lead to fracture or reinfection.

Contact Us If:
- Pain or swelling worsens after several days
- The temporary filling falls out
- You experience an allergic reaction to medication
- Your bite feels uneven`,
  },
  {
    id: 'after-filling',
    title: 'After Dental Filling',
    category: 'Post-Op Instructions',
    summary: 'What to expect and how to care for a new dental filling.',
    content: `After receiving a dental filling, here is what you need to know:

Composite (White) Fillings:
- These are fully hardened when you leave the office.
- You may eat as soon as the numbness wears off.

Amalgam (Silver) Fillings:
- Wait at least 24 hours before chewing on the side of the filling.
- The filling takes time to fully harden.

Sensitivity:
- Some sensitivity to hot, cold, and pressure is normal for a few days to weeks.
- Use toothpaste for sensitive teeth if needed.
- Sensitivity should gradually decrease.

Bite Check:
- If your bite feels uneven or high, contact us for an adjustment.
- Do not try to adjust the filling yourself.

Oral Hygiene:
- Resume normal brushing and flossing.
- Use fluoride toothpaste to help strengthen the tooth.

Contact Us If:
- Sharp or throbbing pain that does not improve
- The filling feels too high after 24 hours
- A piece of the filling chips or falls out
- You experience sensitivity that worsens over time`,
  },
  {
    id: 'brushing-guide',
    title: 'Proper Brushing Technique',
    category: 'Oral Hygiene',
    summary: 'Step-by-step guide to effective tooth brushing.',
    content: `Good brushing technique is the foundation of oral health. Follow these steps for effective cleaning:

Equipment:
- Use a soft-bristled toothbrush (replace every 3-4 months or when bristles fray).
- Use fluoride toothpaste (ADA-approved).
- Consider an electric toothbrush for more effective plaque removal.

Technique:
1. Hold your toothbrush at a 45-degree angle to your gum line.
2. Use short, gentle back-and-forth strokes about the width of a tooth.
3. Brush the outer surfaces, inner surfaces, and chewing surfaces of all teeth.
4. For the inner surfaces of front teeth, tilt the brush vertically and use up-and-down strokes.
5. Brush your tongue to remove bacteria and freshen breath.

Duration:
- Brush for at least 2 minutes, twice daily.
- Divide your mouth into four quadrants and spend 30 seconds on each.
- Use a timer or an electric toothbrush with a built-in timer.

Tips:
- Do not brush too hard. Excessive pressure can damage gums and enamel.
- Wait 30 minutes after eating acidic foods before brushing.
- Brush before bed. Saliva production decreases during sleep, making teeth more vulnerable.
- Replace your toothbrush after being sick.`,
  },
  {
    id: 'flossing-guide',
    title: 'Proper Flossing Technique',
    category: 'Oral Hygiene',
    summary: 'How to floss effectively for optimal gum health.',
    content: `Flossing removes plaque and food particles from between teeth where your toothbrush cannot reach. Here is how to do it properly:

How to Floss:
1. Use about 18 inches of floss. Wind most around your middle fingers, leaving 1-2 inches to work with.
2. Hold the floss tightly between your thumbs and index fingers.
3. Guide the floss gently between your teeth using a rubbing motion.
4. When the floss reaches the gum line, curve it into a C shape against one tooth.
5. Slide it gently into the space between the gum and the tooth.
6. Hold the floss tightly against the tooth and rub the side of the tooth with up-and-down motions.
7. Repeat on the other side of the gap and for all teeth.

Frequency:
- Floss at least once a day, ideally before bedtime.
- It does not matter whether you floss before or after brushing.

Alternatives to Traditional Floss:
- Floss picks: Convenient but less effective than traditional floss.
- Water flossers: Great for people with braces, implants, or difficulty using traditional floss.
- Interdental brushes: Effective for larger gaps between teeth.

Common Concerns:
- Bleeding gums when starting to floss is normal and should stop within 1-2 weeks of regular flossing.
- If bleeding persists beyond 2 weeks, contact our office.
- Flossing should not be painful. Be gentle around the gum line.`,
  },
  {
    id: 'crown-care',
    title: 'Caring for Dental Crowns',
    category: 'Treatment Info',
    summary: 'How to maintain and protect your dental crown.',
    content: `A dental crown is a cap that covers and protects a damaged tooth. Proper care ensures it lasts for many years.

Temporary Crown Care:
- Avoid sticky or chewy foods that can pull off the temporary crown.
- Chew on the opposite side of your mouth.
- Brush gently around the temporary crown.
- When flossing, pull the floss out from the side rather than snapping it up.

Permanent Crown Care:
- Brush twice daily with fluoride toothpaste.
- Floss daily, being careful around the crown margin.
- Use a non-abrasive toothpaste.
- Avoid chewing ice, hard candy, or other hard objects.

Longevity Tips:
- Wear a night guard if you grind your teeth.
- Avoid using your teeth as tools (opening packages, etc.).
- Regular dental check-ups allow us to monitor crown integrity.
- Crowns typically last 10-15 years with proper care.

Warning Signs:
- Pain or sensitivity around the crown
- The crown feels loose or wobbles
- A dark line at the gum line (for porcelain-fused-to-metal crowns)
- Chipping or cracking of the crown material

Contact us immediately if your crown falls off. Keep it safe and bring it to your appointment.`,
  },
  {
    id: 'dental-implants',
    title: 'Dental Implant Care',
    category: 'Treatment Info',
    summary: 'Maintaining and caring for dental implants.',
    content: `Dental implants are a long-term solution for missing teeth. While they cannot get cavities, they still require diligent care.

Daily Care:
- Brush twice daily with a soft-bristled brush.
- Use a low-abrasive toothpaste.
- Floss daily using unwaxed tape or implant-specific floss.
- Consider using an interdental brush around the implant.
- A water flosser can be helpful for cleaning around implants.

Professional Maintenance:
- Visit your dentist every 6 months for check-ups and cleanings.
- Professional cleanings around implants use specialized instruments.
- Regular X-rays monitor bone levels around the implant.

Things to Avoid:
- Smoking, which significantly increases implant failure risk.
- Abrasive toothpaste or hard-bristled brushes.
- Chewing excessively hard foods directly on the implant.
- Metal instruments near the implant (can scratch the surface).

Signs of Trouble:
- Redness or swelling around the implant
- Bleeding when brushing or flossing
- The implant feels loose
- Pain or discomfort around the implant
- Pus or bad taste around the implant

With proper care, dental implants can last a lifetime. Contact us if you notice any changes.`,
  },
  {
    id: 'preventive-sealants',
    title: 'Dental Sealants',
    category: 'Prevention',
    summary: 'Understanding dental sealants and their role in cavity prevention.',
    content: `Dental sealants are thin, protective coatings applied to the chewing surfaces of back teeth (molars) to prevent cavities.

What Are Sealants?
- A thin, plastic-like coating painted on the grooves of molars.
- They create a barrier that protects tooth enamel from plaque and acids.
- Quick and painless to apply -- no drilling or numbing required.

Who Should Get Sealants?
- Children and teenagers: Apply as soon as permanent molars come in (around ages 6 and 12).
- Adults: Those with deep grooves in their teeth who are prone to decay.
- The sooner sealants are applied after eruption, the better the protection.

How Long Do They Last?
- Sealants can protect teeth for up to 10 years.
- They are checked at regular dental visits and can be reapplied as needed.
- Studies show sealants reduce cavities by up to 80% in the first two years.

Care After Application:
- You can eat and drink normally after application.
- Continue regular brushing and flossing.
- Avoid chewing ice or hard candy, which can chip sealants.
- Let us know if a sealant feels rough or seems to be wearing off.`,
  },
  {
    id: 'fluoride-treatments',
    title: 'Fluoride Treatments',
    category: 'Prevention',
    summary: 'Benefits and importance of professional fluoride treatments.',
    content: `Fluoride is a mineral that strengthens tooth enamel and helps prevent cavities. Professional fluoride treatments provide a higher concentration than toothpaste alone.

Benefits:
- Strengthens weakened tooth enamel.
- Reverses early signs of tooth decay (demineralization).
- Reduces the amount of acid produced by bacteria in your mouth.
- Provides extra protection for those at higher risk of cavities.

Who Benefits Most?
- Children during tooth development years.
- Adults with dry mouth conditions.
- People with a history of frequent cavities.
- Patients with crowns, bridges, or braces.
- Those with gum disease or receding gums.

After Treatment:
- Wait 30 minutes before eating or drinking.
- Avoid hot beverages and alcohol for at least 6 hours.
- Do not brush or floss for at least 4-6 hours.

At Home:
- Use fluoride toothpaste (look for the ADA Seal of Acceptance).
- Drink fluoridated water.
- Ask about prescription-strength fluoride rinses if recommended.`,
  },
  {
    id: 'mouthguards',
    title: 'Sports Mouthguards',
    category: 'Prevention',
    summary: 'Protecting teeth during sports and physical activities.',
    content: `A mouthguard is an essential piece of equipment for anyone participating in sports or physical activities.

Types of Mouthguards:
- Custom-fitted: Made by your dentist from an impression of your teeth. Best fit and protection.
- Boil-and-bite: Available at sporting goods stores. Softened in hot water and shaped around teeth.
- Stock: Pre-formed and ready to wear. Least expensive but least comfortable.

When to Wear One:
- Contact sports: Football, basketball, hockey, boxing, martial arts.
- Non-contact sports with risk: Gymnastics, skateboarding, mountain biking.
- Recreational activities: Roller skating, skiing, snowboarding.
- Any activity where falls or contact to the face are possible.

Care and Maintenance:
- Rinse with cold water or mouthwash before and after use.
- Clean with a toothbrush and toothpaste after each use.
- Store in a firm, perforated container to allow air circulation.
- Keep away from heat and direct sunlight.
- Replace when it shows wear, becomes loose, or causes discomfort.
- Bring it to dental appointments so we can check the fit.

A custom mouthguard from our office provides the best protection and comfort. Ask us about getting one made.`,
  },
];

// ═══════════════════ MAIN PAGE ═══════════════════

export default function PatientEducationPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | ''>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const filteredResources = useMemo(() => {
    return RESOURCES.filter((r) => {
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.summary.toLowerCase().includes(search.toLowerCase()) ||
        r.content.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const toggleExpanded = (id: string) => {
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

  const handlePrint = (resource: Resource) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resource.title}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1c1917; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            .category { color: #78716c; font-size: 14px; margin-bottom: 24px; }
            .content { white-space: pre-wrap; font-size: 14px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>${resource.title}</h1>
          <div class="category">${resource.category}</div>
          <div class="content">${resource.content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const categories = Object.keys(CATEGORY_CONFIG) as ResourceCategory[];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    RESOURCES.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Patient Education</h1>
        <p className="mt-1 text-sm text-stone-500">
          Dental education resources to share with patients.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                categoryFilter === cat
                  ? config.bgColor
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              )}
            >
              <Icon className={cn('h-5 w-5', config.color)} />
              <p className="mt-2 text-sm font-medium text-stone-900">{cat}</p>
              <p className="text-xs text-stone-500">{categoryCounts[cat] || 0} resources</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        {(search || categoryFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
            }}
            className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500 hover:bg-stone-50"
          >
            <Filter className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-stone-500">
        {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} found
        {categoryFilter && ` in ${categoryFilter}`}
      </p>

      {/* Resource Cards */}
      <div className="space-y-3">
        {filteredResources.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
            <BookOpen className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No resources found</h3>
            <p className="mt-1 text-xs text-stone-500">Try adjusting your search or filter.</p>
          </div>
        ) : (
          filteredResources.map((resource) => {
            const isExpanded = expandedIds.has(resource.id);
            const config = CATEGORY_CONFIG[resource.category];
            const Icon = config.icon;

            return (
              <div
                key={resource.id}
                className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleExpanded(resource.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn('rounded-lg border p-2.5', config.bgColor)}
                    >
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-stone-900">{resource.title}</h3>
                      <p className="mt-0.5 text-xs text-stone-500">{resource.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={cn(
                        'hidden sm:inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        config.bgColor
                      )}
                    >
                      {resource.category}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-stone-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-200 px-6 py-5">
                    <div className="prose prose-sm prose-stone max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-stone-700 leading-relaxed bg-transparent border-none p-0 m-0">
                        {resource.content}
                      </pre>
                    </div>
                    <div className="mt-4 flex justify-end border-t border-stone-100 pt-4">
                      <button
                        onClick={() => handlePrint(resource)}
                        className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
