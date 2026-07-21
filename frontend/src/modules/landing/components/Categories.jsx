import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { Cpu, Binary, Atom, Dna, HeartPulse, FlaskConical, Circle, Search } from 'lucide-react';
import Card from '../../../components/ui/Card';

const iconMap = {
  Cpu: Cpu,
  Binary: Binary,
  Atom: Atom,
  Dna: Dna,
  HeartPulse: HeartPulse,
  FlaskConical: FlaskConical
};

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axiosInstance.get('/categories');
      return response.data;
    },
    initialData: [
      { categoryId: 'cs', categoryName: 'Computer Science', papersCount: 4250, categoryIcon: 'Cpu' },
      { categoryId: 'math', categoryName: 'Mathematics', papersCount: 1820, categoryIcon: 'Binary' },
      { categoryId: 'physics', categoryName: 'Physics', papersCount: 2980, categoryIcon: 'Atom' },
      { categoryId: 'bio', categoryName: 'Biology & Life Sciences', papersCount: 3410, categoryIcon: 'Dna' },
      { categoryId: 'med', categoryName: 'Medicine & Healthcare', papersCount: 4120, categoryIcon: 'HeartPulse' },
      { categoryId: 'chem', categoryName: 'Chemistry', papersCount: 1890, categoryIcon: 'FlaskConical' }
    ]
  });

  const filteredCategories = categories?.filter((cat) =>
    cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="researchers" className="py-20 px-4 bg-bg-card border-b border-border">
      <div className="max-w-7xl mx-auto text-center space-y-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Research Categories
          </h2>
          <p className="text-base text-text-secondary">
            Explore academic disciplines indexed on our platform. Filter through thousands of publications semantically mapped by area.
          </p>
          
          {/* Added Feature: Search Filter Bar */}
          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-bg-page text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Dynamic content rendering handles loading state & filtered output */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {isLoading ? (
            <div className="col-span-full text-text-secondary py-4 text-sm animate-pulse">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full text-text-secondary py-4 text-sm">No categories match your search.</div>
          ) : (
            filteredCategories.map((cat) => {
              const IconComponent = iconMap[cat.categoryIcon] || Circle;
              return (
                <Card key={cat.categoryId} hoverEffect={true} className="flex flex-col items-center justify-center p-6 bg-bg-page/40 cursor-pointer transition-transform hover:scale-[1.02]">
                  <div className="p-3 bg-light-blue text-primary rounded-xl mb-3 flex items-center justify-center">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-xs text-text-primary mb-1 truncate w-full text-center">
                    {cat.categoryName}
                  </h3>
                  <p className="text-[10px] text-text-secondary font-medium">
                    {cat.papersCount.toLocaleString()} papers
                  </p>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
