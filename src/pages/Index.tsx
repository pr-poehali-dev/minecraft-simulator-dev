import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'plank' | 'coal' | 'iron' | 'gold' | 'diamond' | 'air';

interface Block {
  type: BlockType;
  x: number;
  y: number;
}

interface Item {
  type: BlockType;
  count: number;
}

interface Recipe {
  result: BlockType;
  ingredients: { type: BlockType; count: number }[];
  resultCount: number;
}

const blockColors: Record<BlockType, string> = {
  grass: 'bg-[#228B22]',
  dirt: 'bg-[#8B4513]',
  stone: 'bg-[#708090]',
  wood: 'bg-[#8B4513]',
  plank: 'bg-[#DEB887]',
  coal: 'bg-[#2F4F4F]',
  iron: 'bg-[#C0C0C0]',
  gold: 'bg-[#FFD700]',
  diamond: 'bg-[#1LE90FF]',
  air: 'bg-transparent'
};

const blockNames: Record<BlockType, string> = {
  grass: 'Трава',
  dirt: 'Земля',
  stone: 'Камень',
  wood: 'Дерево',
  plank: 'Доски',
  coal: 'Уголь',
  iron: 'Железо',
  gold: 'Золото',
  diamond: 'Алмаз',
  air: 'Воздух'
};

const recipes: Recipe[] = [
  { result: 'plank', ingredients: [{ type: 'wood', count: 1 }], resultCount: 4 },
  { result: 'wood', ingredients: [{ type: 'plank', count: 4 }], resultCount: 1 },
];

export default function Index() {
  const [world, setWorld] = useState<Block[]>([]);
  const [inventory, setInventory] = useState<Item[]>([
    { type: 'grass', count: 0 },
    { type: 'dirt', count: 0 },
    { type: 'stone', count: 0 },
    { type: 'wood', count: 0 },
    { type: 'plank', count: 0 },
    { type: 'coal', count: 0 },
    { type: 'iron', count: 0 },
    { type: 'gold', count: 0 },
    { type: 'diamond', count: 0 }
  ]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [time, setTime] = useState(0);
  const [isDay, setIsDay] = useState(true);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    const initialWorld: Block[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 12; x++) {
        if (y >= 6) {
          initialWorld.push({ type: 'grass', x, y });
        } else if (y >= 4) {
          initialWorld.push({ type: 'dirt', x, y });
        } else if (y >= 2) {
          initialWorld.push({ type: 'stone', x, y });
        } else {
          if (Math.random() > 0.9) {
            const ores: BlockType[] = ['coal', 'iron', 'gold', 'diamond'];
            initialWorld.push({ type: ores[Math.floor(Math.random() * ores.length)], x, y });
          } else {
            initialWorld.push({ type: 'stone', x, y });
          }
        }
      }
    }
    
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * 10) + 1;
      for (let h = 0; h < 3; h++) {
        initialWorld.push({ type: 'wood', x, y: 7 + h });
      }
    }
    
    setWorld(initialWorld);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        const newTime = (prev + 1) % 240;
        setIsDay(newTime < 120);
        return newTime;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const mineBlock = (x: number, y: number) => {
    const block = world.find(b => b.x === x && b.y === y);
    if (!block || block.type === 'air') return;

    setWorld(prev => prev.map(b => 
      b.x === x && b.y === y ? { ...b, type: 'air' } : b
    ));

    setInventory(prev => prev.map(item => 
      item.type === block.type 
        ? { ...item, count: item.count + 1 }
        : item
    ));
  };

  const placeBlock = (x: number, y: number) => {
    const block = world.find(b => b.x === x && b.y === y);
    if (!block || block.type !== 'air') return;

    const selectedItem = inventory[selectedSlot];
    if (!selectedItem || selectedItem.count === 0) return;

    setWorld(prev => prev.map(b => 
      b.x === x && b.y === y ? { ...b, type: selectedItem.type } : b
    ));

    setInventory(prev => prev.map((item, idx) => 
      idx === selectedSlot && item.count > 0
        ? { ...item, count: item.count - 1 }
        : item
    ));
  };

  const craft = (recipe: Recipe) => {
    const canCraft = recipe.ingredients.every(ing => {
      const item = inventory.find(i => i.type === ing.type);
      return item && item.count >= ing.count;
    });

    if (!canCraft) return;

    setInventory(prev => prev.map(item => {
      const ingredient = recipe.ingredients.find(ing => ing.type === item.type);
      if (ingredient) {
        return { ...item, count: item.count - ingredient.count };
      }
      if (item.type === recipe.result) {
        return { ...item, count: item.count + recipe.resultCount };
      }
      return item;
    }));
  };

  return (
    <div className="min-h-screen p-4" style={{
      background: isDay 
        ? 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)'
        : 'linear-gradient(to bottom, #0A1929 0%, #1a365d 100%)'
    }}>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            MINECRAFT
          </h1>
          
          <div className="flex gap-6 items-center bg-black/60 px-6 py-3 border-4 border-black">
            <div className="flex items-center gap-2">
              <Icon name="Heart" className="text-red-500" size={20} />
              <Progress value={health} className="w-24 h-4" />
              <span className="text-white text-xs">{health}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Icon name="Drumstick" className="text-orange-500" size={20} />
              <Progress value={hunger} className="w-24 h-4" />
              <span className="text-white text-xs">{hunger}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Icon name={isDay ? "Sun" : "Moon"} className={isDay ? "text-yellow-400" : "text-blue-200"} size={20} />
              <span className="text-white text-xs">{isDay ? 'День' : 'Ночь'}</span>
            </div>
          </div>
        </div>

        <Card className="p-6 bg-[#87CEEB]/90 border-4 border-black overflow-hidden">
          <div className="grid gap-0" style={{
            gridTemplateColumns: 'repeat(12, 50px)',
            gridTemplateRows: 'repeat(10, 50px)'
          }}>
            {world.map((block, idx) => (
              <button
                key={idx}
                className={`${blockColors[block.type]} border-2 border-black/30 transition-all hover:scale-105 active:scale-95 relative group`}
                onClick={(e) => {
                  if (e.shiftKey) {
                    placeBlock(block.x, block.y);
                  } else {
                    mineBlock(block.x, block.y);
                  }
                }}
                title={blockNames[block.type]}
              >
                {block.type === 'grass' && (
                  <div className="absolute inset-0 border-t-4 border-[#228B22]" />
                )}
                {block.type === 'coal' && (
                  <div className="w-3 h-3 bg-black rounded-full absolute inset-0 m-auto" />
                )}
                {block.type === 'iron' && (
                  <div className="w-3 h-3 bg-white rounded-sm absolute inset-0 m-auto" />
                )}
                {block.type === 'gold' && (
                  <div className="w-3 h-3 bg-[#FFD700] rounded-sm absolute inset-0 m-auto shadow-lg" />
                )}
                {block.type === 'diamond' && (
                  <div className="w-3 h-3 bg-cyan-400 rotate-45 absolute inset-0 m-auto shadow-lg" />
                )}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-4">
          <div className="flex gap-2 bg-black/80 p-3 border-4 border-black flex-1">
            {inventory.slice(0, 9).map((item, idx) => (
              <button
                key={idx}
                className={`w-16 h-16 ${blockColors[item.type]} border-4 transition-all hover:scale-105 relative ${
                  selectedSlot === idx ? 'border-white' : 'border-gray-600'
                }`}
                onClick={() => setSelectedSlot(idx)}
              >
                {item.count > 0 && (
                  <span className="absolute bottom-1 right-1 text-white text-xs font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowInventory(!showInventory)}
            className="px-8 border-4 border-black text-base h-auto"
          >
            {showInventory ? 'Закрыть' : 'Инвентарь'}
          </Button>
        </div>

        {showInventory && (
          <Card className="p-6 bg-[#8B4513] border-4 border-black animate-in slide-in-from-bottom">
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-2 border-4 border-black">
                <TabsTrigger value="inventory" className="text-sm">Инвентарь</TabsTrigger>
                <TabsTrigger value="crafting" className="text-sm">Крафт</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inventory" className="mt-4">
                <div className="grid grid-cols-9 gap-2">
                  {inventory.map((item, idx) => (
                    <Card key={idx} className={`${blockColors[item.type]} p-4 border-4 border-black relative h-20`}>
                      <div className="text-white text-xs text-center drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {blockNames[item.type]}
                      </div>
                      {item.count > 0 && (
                        <div className="absolute bottom-2 right-2 text-white text-sm font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                          {item.count}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="crafting" className="mt-4">
                <div className="space-y-3">
                  <h3 className="text-white text-sm">Рецепты крафта:</h3>
                  {recipes.map((recipe, idx) => (
                    <Card key={idx} className="p-4 bg-[#DEB887] border-4 border-black">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {recipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-12 h-12 ${blockColors[ing.type]} border-2 border-black`} />
                              <span className="text-xs">x{ing.count}</span>
                            </div>
                          ))}
                          <Icon name="ArrowRight" size={20} />
                          <div className="flex items-center gap-2">
                            <div className={`w-12 h-12 ${blockColors[recipe.result]} border-2 border-black`} />
                            <span className="text-xs">x{recipe.resultCount}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => craft(recipe)}
                          size="sm"
                          className="border-4 border-black"
                        >
                          Создать
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        <Card className="p-4 bg-black/80 border-4 border-black">
          <div className="text-white text-xs space-y-1">
            <p>🖱️ ЛКМ - добыть блок | Shift + ЛКМ - поставить блок</p>
            <p>🎮 Цифры 1-9 - выбор слота | E - открыть инвентарь</p>
          </div>
        </Card>
      </div>
    </div>
  );
}