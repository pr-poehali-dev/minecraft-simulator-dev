import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'plank' | 'coal' | 'iron' | 'gold' | 'diamond' | 'air' | 'leaves' | 'crafting_table' | 'bedrock' | 'rails' | 'torch';
type ToolType = 'hand' | 'wooden_pickaxe' | 'stone_pickaxe' | 'iron_pickaxe' | 'wooden_axe' | 'stone_axe' | 'sword';
type MobType = 'cow' | 'pig' | 'chicken' | 'sheep' | 'zombie' | 'skeleton' | 'creeper';

interface Block {
  type: BlockType;
  x: number;
  y: number;
}

interface Item {
  type: BlockType | ToolType;
  count: number;
  isTool?: boolean;
}

interface Mob {
  type: MobType;
  x: number;
  y: number;
  health: number;
  isHostile: boolean;
}

interface Player {
  x: number;
  y: number;
  direction: 'left' | 'right';
}

interface Recipe {
  result: BlockType | ToolType;
  ingredients: { type: BlockType | ToolType; count: number }[];
  resultCount: number;
  requiresCraftingTable?: boolean;
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
  leaves: 'bg-[#228B22]/70',
  crafting_table: 'bg-[#8B4513]',
  bedrock: 'bg-[#1a1a1a]',
  rails: 'bg-[#4a4a4a]',
  torch: 'bg-[#8B4513]',
  air: 'bg-transparent'
};

const blockHardness: Record<BlockType, { tool: ToolType[], time: number }> = {
  grass: { tool: ['hand'], time: 0.5 },
  dirt: { tool: ['hand'], time: 0.5 },
  stone: { tool: ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe'], time: 1.5 },
  wood: { tool: ['hand', 'wooden_axe', 'stone_axe'], time: 1 },
  plank: { tool: ['hand'], time: 0.5 },
  coal: { tool: ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe'], time: 1.5 },
  iron: { tool: ['stone_pickaxe', 'iron_pickaxe'], time: 2 },
  gold: { tool: ['iron_pickaxe'], time: 2 },
  diamond: { tool: ['iron_pickaxe'], time: 3 },
  leaves: { tool: ['hand'], time: 0.3 },
  crafting_table: { tool: ['hand'], time: 0.5 },
  rails: { tool: ['hand'], time: 0.5 },
  torch: { tool: ['hand'], time: 0.1 },
  bedrock: { tool: [], time: 999 },
  air: { tool: ['hand'], time: 0 }
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
  leaves: 'Листва',
  crafting_table: 'Верстак',
  bedrock: 'Коренная порода',
  rails: 'Рельсы',
  torch: 'Факел',
  air: 'Воздух'
};

const toolNames: Record<ToolType, string> = {
  hand: 'Рука',
  wooden_pickaxe: 'Деревянная кирка',
  stone_pickaxe: 'Каменная кирка',
  iron_pickaxe: 'Железная кирка',
  wooden_axe: 'Деревянный топор',
  stone_axe: 'Каменный топор',
  sword: 'Меч'
};

const mobNames: Record<MobType, string> = {
  cow: '🐄',
  pig: '🐷',
  chicken: '🐔',
  sheep: '🐑',
  zombie: '🧟',
  skeleton: '💀',
  creeper: '💥'
};

const recipes: Recipe[] = [
  { result: 'plank', ingredients: [{ type: 'wood', count: 1 }], resultCount: 4 },
  { result: 'crafting_table', ingredients: [{ type: 'plank', count: 4 }], resultCount: 1 },
  { result: 'wooden_pickaxe', ingredients: [{ type: 'plank', count: 3 }, { type: 'wood', count: 2 }], resultCount: 1, requiresCraftingTable: true },
  { result: 'wooden_axe', ingredients: [{ type: 'plank', count: 3 }, { type: 'wood', count: 2 }], resultCount: 1, requiresCraftingTable: true },
  { result: 'stone_pickaxe', ingredients: [{ type: 'stone', count: 3 }, { type: 'wood', count: 2 }], resultCount: 1, requiresCraftingTable: true },
  { result: 'stone_axe', ingredients: [{ type: 'stone', count: 3 }, { type: 'wood', count: 2 }], resultCount: 1, requiresCraftingTable: true },
  { result: 'iron_pickaxe', ingredients: [{ type: 'iron', count: 3 }, { type: 'wood', count: 2 }], resultCount: 1, requiresCraftingTable: true },
  { result: 'sword', ingredients: [{ type: 'iron', count: 2 }, { type: 'wood', count: 1 }], resultCount: 1, requiresCraftingTable: true },
  { result: 'torch', ingredients: [{ type: 'coal', count: 1 }, { type: 'wood', count: 1 }], resultCount: 4 },
];

const generateCave = (startX: number, startY: number, length: number): Block[] => {
  const blocks: Block[] = [];
  let x = startX;
  let y = startY;
  
  for (let i = 0; i < length; i++) {
    for (let r = -2; r <= 2; r++) {
      blocks.push({ type: 'air', x: x + Math.floor(Math.random() * 2), y: y + r });
    }
    x += Math.random() > 0.5 ? 1 : 0;
    y += Math.floor(Math.random() * 3) - 1;
    y = Math.max(3, Math.min(15, y));
  }
  
  return blocks;
};

const generateMine = (startX: number, startY: number): Block[] => {
  const blocks: Block[] = [];
  
  for (let i = 0; i < 15; i++) {
    blocks.push({ type: 'air', x: startX + i, y: startY });
    blocks.push({ type: 'air', x: startX + i, y: startY + 1 });
    if (i % 3 === 0) {
      blocks.push({ type: 'rails', x: startX + i, y: startY });
      blocks.push({ type: 'torch', x: startX + i, y: startY + 1 });
    }
  }
  
  for (let v = 0; v < 8; v++) {
    blocks.push({ type: 'air', x: startX, y: startY - v });
  }
  
  return blocks;
};

const generateWorld = (offsetX: number): Block[] => {
  const blocks: Block[] = [];
  const worldHeight = 40;
  const worldWidth = 200;
  
  for (let x = offsetX; x < offsetX + worldWidth; x++) {
    blocks.push({ type: 'bedrock', x, y: 0 });
    
    const surfaceHeight = 25 + Math.floor(Math.sin(x * 0.1) * 3);
    
    for (let y = 1; y < worldHeight; y++) {
      if (y > surfaceHeight) {
        blocks.push({ type: 'air', x, y });
      } else if (y === surfaceHeight) {
        blocks.push({ type: 'grass', x, y });
      } else if (y > surfaceHeight - 3) {
        blocks.push({ type: 'dirt', x, y });
      } else if (y > 2) {
        if (Math.random() > 0.96) {
          if (y < 5) {
            blocks.push({ type: Math.random() > 0.5 ? 'diamond' : 'gold', x, y });
          } else if (y < 12) {
            blocks.push({ type: Math.random() > 0.5 ? 'iron' : 'gold', x, y });
          } else {
            blocks.push({ type: 'coal', x, y });
          }
        } else {
          blocks.push({ type: 'stone', x, y });
        }
      } else {
        blocks.push({ type: 'stone', x, y });
      }
    }
    
    if (Math.random() > 0.96 && x % 5 === 0) {
      const treeHeight = 4 + Math.floor(Math.random() * 2);
      for (let h = 0; h < treeHeight; h++) {
        blocks.push({ type: 'wood', x, y: surfaceHeight + 1 + h });
      }
      for (let lx = -2; lx <= 2; lx++) {
        for (let ly = 0; ly < 3; ly++) {
          blocks.push({ type: 'leaves', x: x + lx, y: surfaceHeight + treeHeight + ly });
        }
      }
    }
  }
  
  const cave1 = generateCave(30, 12, 40);
  const cave2 = generateCave(100, 10, 50);
  const cave3 = generateCave(160, 8, 45);
  
  const mine1 = generateMine(50, 8);
  const mine2 = generateMine(120, 6);
  
  return [...blocks, ...cave1, ...cave2, ...cave3, ...mine1, ...mine2];
};

const generateVillage = (startX: number, surfaceY: number): Block[] => {
  const blocks: Block[] = [];
  
  for (let house = 0; house < 3; house++) {
    const houseX = startX + house * 10;
    for (let hx = 0; hx < 6; hx++) {
      for (let hy = 0; hy < 5; hy++) {
        if (hy === 0 || hy === 4 || hx === 0 || hx === 5) {
          blocks.push({ type: 'plank', x: houseX + hx, y: surfaceY + 1 + hy });
        }
      }
    }
    blocks.push({ type: 'crafting_table', x: houseX + 2, y: surfaceY + 1 });
    
    for (let i = 0; i < 3; i++) {
      blocks.push({ type: 'torch', x: houseX + i * 2, y: surfaceY + 3 });
    }
  }
  
  return blocks;
};

export default function Index() {
  const [world, setWorld] = useState<Block[]>([]);
  const [mobs, setMobs] = useState<Mob[]>([]);
  const [player, setPlayer] = useState<Player>({ x: 60, y: 26, direction: 'right' });
  const [cameraX, setCameraX] = useState(50);
  const [cameraY, setCameraY] = useState(15);
  const [inventory, setInventory] = useState<Item[]>([
    { type: 'grass', count: 0 },
    { type: 'dirt', count: 0 },
    { type: 'stone', count: 0 },
    { type: 'wood', count: 0 },
    { type: 'plank', count: 0 },
    { type: 'coal', count: 0 },
    { type: 'iron', count: 0 },
    { type: 'gold', count: 0 },
    { type: 'diamond', count: 0 },
    { type: 'crafting_table', count: 0 },
    { type: 'torch', count: 0 },
    { type: 'wooden_pickaxe', count: 0, isTool: true },
    { type: 'stone_pickaxe', count: 0, isTool: true },
    { type: 'iron_pickaxe', count: 0, isTool: true },
    { type: 'wooden_axe', count: 0, isTool: true },
    { type: 'stone_axe', count: 0, isTool: true },
    { type: 'sword', count: 0, isTool: true }
  ]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [time, setTime] = useState(0);
  const [isDay, setIsDay] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [hasCraftingTable, setHasCraftingTable] = useState(false);

  useEffect(() => {
    const initialWorld = generateWorld(0);
    const village1 = generateVillage(80, 25);
    const village2 = generateVillage(150, 25);
    const village3 = generateVillage(20, 25);
    const village4 = generateVillage(180, 25);
    setWorld([...initialWorld, ...village1, ...village2, ...village3, ...village4]);
    
    const initialMobs: Mob[] = [];
    const animalTypes: MobType[] = ['cow', 'pig', 'chicken', 'sheep'];
    for (let i = 0; i < 20; i++) {
      initialMobs.push({
        type: animalTypes[Math.floor(Math.random() * animalTypes.length)],
        x: 30 + i * 8,
        y: 26,
        health: 10,
        isHostile: false
      });
    }
    setMobs(initialMobs);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        const newTime = (prev + 1) % 240;
        const newIsDay = newTime < 120;
        setIsDay(newIsDay);
        
        if (newTime === 120) {
          setMobs(prev => {
            const hostileMobs: Mob[] = [];
            for (let i = 0; i < 5; i++) {
              const mobTypes: MobType[] = ['zombie', 'skeleton', 'creeper'];
              hostileMobs.push({
                type: mobTypes[Math.floor(Math.random() * mobTypes.length)],
                x: player.x - 10 + Math.random() * 20,
                y: 26,
                health: 20,
                isHostile: true
              });
            }
            return [...prev.filter(m => !m.isHostile), ...hostileMobs];
          });
        }
        
        return newTime;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [player.x]);

  useEffect(() => {
    const mobTimer = setInterval(() => {
      setMobs(prev => prev.map(mob => {
        const newX = mob.x + (Math.random() - 0.5) * 2;
        
        if (mob.isHostile) {
          const distToPlayer = Math.abs(mob.x - player.x) + Math.abs(mob.y - player.y);
          if (distToPlayer < 2) {
            setHealth(h => Math.max(0, h - 5));
          }
          if (mob.x < player.x) {
            return { ...mob, x: mob.x + 0.3 };
          } else {
            return { ...mob, x: mob.x - 0.3 };
          }
        }
        
        return { ...mob, x: newX };
      }));
    }, 500);
    return () => clearInterval(mobTimer);
  }, [player]);

  const getCurrentTool = (): ToolType => {
    const selectedItem = inventory[selectedSlot];
    if (selectedItem?.isTool) return selectedItem.type as ToolType;
    return 'hand';
  };

  const canMineBlock = (blockType: BlockType, tool: ToolType): boolean => {
    const hardness = blockHardness[blockType];
    if (blockType === 'bedrock') return false;
    if (hardness.tool.length === 0) return false;
    if (hardness.tool.includes('hand')) return true;
    return hardness.tool.includes(tool);
  };

  const mineBlock = (x: number, y: number) => {
    const block = world.find(b => b.x === x && b.y === y);
    if (!block || block.type === 'air') return;

    const tool = getCurrentTool();
    if (!canMineBlock(block.type, tool)) return;

    setWorld(prev => prev.map(b => 
      b.x === x && b.y === y ? { ...b, type: 'air' } : b
    ));

    setInventory(prev => prev.map(item => 
      item.type === block.type && !item.isTool
        ? { ...item, count: item.count + 1 }
        : item
    ));
  };

  const placeBlock = (x: number, y: number) => {
    const block = world.find(b => b.x === x && b.y === y);
    if (!block || block.type !== 'air') return;

    const selectedItem = inventory[selectedSlot];
    if (!selectedItem || selectedItem.count === 0 || selectedItem.isTool) return;

    setWorld(prev => {
      const existing = prev.find(b => b.x === x && b.y === y);
      if (existing) {
        return prev.map(b => b.x === x && b.y === y ? { ...b, type: selectedItem.type as BlockType } : b);
      }
      return [...prev, { type: selectedItem.type as BlockType, x, y }];
    });

    setInventory(prev => prev.map((item, idx) => 
      idx === selectedSlot && item.count > 0
        ? { ...item, count: item.count - 1 }
        : item
    ));

    if (selectedItem.type === 'crafting_table') {
      setHasCraftingTable(true);
    }
  };

  const craft = (recipe: Recipe) => {
    if (recipe.requiresCraftingTable && !hasCraftingTable) return;
    
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

  const attackMob = (mob: Mob) => {
    const tool = getCurrentTool();
    const damage = tool === 'sword' ? 20 : 10;
    
    setMobs(prev => prev.map(m => 
      m === mob ? { ...m, health: m.health - damage } : m
    ).filter(m => m.health > 0));
  };

  const movePlayer = (dx: number, dy: number) => {
    const newX = player.x + dx;
    const newY = player.y + dy;
    
    const blockAtPos = world.find(b => b.x === Math.floor(newX) && b.y === Math.floor(newY));
    if (!blockAtPos || blockAtPos.type === 'air' || blockAtPos.type === 'rails' || blockAtPos.type === 'torch') {
      const newDirection = dx < 0 ? 'left' : dx > 0 ? 'right' : player.direction;
      setPlayer({ x: newX, y: newY, direction: newDirection });
      setCameraX(newX);
      setCameraY(Math.floor(newY));
    }
  };

  const visibleBlocks = world.filter(b => 
    b.x >= cameraX - 12 && b.x < cameraX + 13 && b.y >= cameraY - 10 && b.y < cameraY + 10
  );

  const visibleMobs = mobs.filter(m => 
    m.x >= cameraX - 12 && m.x < cameraX + 13 && m.y >= cameraY - 10 && m.y < cameraY + 10
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1, 0);
      if (e.key === 'ArrowUp' || e.key === 'w') movePlayer(0, 1);
      if (e.key === 'ArrowDown' || e.key === 's') movePlayer(0, -1);
      if (e.key === 'e' || e.key === 'E') setShowInventory(prev => !prev);
      if (e.key >= '1' && e.key <= '9') setSelectedSlot(parseInt(e.key) - 1);
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [player]);

  return (
    <div className="min-h-screen p-4" style={{
      background: isDay 
        ? 'linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 100%)'
        : 'linear-gradient(to bottom, #0A1929 0%, #1a365d 100%)'
    }}>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
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

        <Card className="p-6 bg-[#87CEEB]/90 border-4 border-black overflow-hidden relative">
          <div className="grid gap-0" style={{
            gridTemplateColumns: 'repeat(25, 40px)',
            gridTemplateRows: 'repeat(20, 40px)'
          }}>
            {visibleBlocks.map((block, idx) => {
              const gridX = block.x - (cameraX - 12);
              const gridY = block.y - (cameraY - 10);
              return (
                <button
                  key={idx}
                  className={`${blockColors[block.type]} border-2 border-black/30 transition-all hover:scale-105 active:scale-95 relative group`}
                  style={{
                    gridColumn: gridX + 1,
                    gridRow: 20 - gridY
                  }}
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
                    <div className="w-2 h-2 bg-black rounded-full absolute inset-0 m-auto" />
                  )}
                  {block.type === 'iron' && (
                    <div className="w-2 h-2 bg-white rounded-sm absolute inset-0 m-auto" />
                  )}
                  {block.type === 'gold' && (
                    <div className="w-2 h-2 bg-[#FFD700] rounded-sm absolute inset-0 m-auto shadow-lg" />
                  )}
                  {block.type === 'diamond' && (
                    <div className="w-2 h-2 bg-cyan-400 rotate-45 absolute inset-0 m-auto shadow-lg" />
                  )}
                  {block.type === 'crafting_table' && (
                    <div className="text-xs absolute inset-0 flex items-center justify-center">🔨</div>
                  )}
                  {block.type === 'rails' && (
                    <div className="text-xs absolute inset-0 flex items-center justify-center">═</div>
                  )}
                  {block.type === 'torch' && (
                    <div className="text-xs absolute inset-0 flex items-center justify-center">🔥</div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div 
            className="absolute z-10 transition-all"
            style={{
              left: `${(player.x - (cameraX - 12)) * 40}px`,
              bottom: `${(20 - (player.y - (cameraY - 10))) * 40}px`,
              width: '40px',
              height: '40px'
            }}
          >
            <div className="relative w-full h-full">
              <div className="text-3xl absolute" style={{
                transform: player.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
                left: player.direction === 'left' ? '8px' : '2px'
              }}>
                🧍
              </div>
              {inventory[selectedSlot]?.count > 0 && (
                <div className="text-lg absolute" style={{
                  right: player.direction === 'right' ? '-8px' : 'auto',
                  left: player.direction === 'left' ? '-8px' : 'auto',
                  bottom: '8px'
                }}>
                  {inventory[selectedSlot].isTool ? (
                    inventory[selectedSlot].type.includes('pickaxe') ? '⛏️' : 
                    inventory[selectedSlot].type === 'sword' ? '⚔️' : '🪓'
                  ) : (
                    inventory[selectedSlot].type === 'torch' ? '🔥' : '📦'
                  )}
                </div>
              )}
            </div>
          </div>
          
          {visibleMobs.map((mob, idx) => {
            const gridX = Math.floor(mob.x) - (cameraX - 12);
            const gridY = Math.floor(mob.y) - (cameraY - 10);
            return (
              <button
                key={idx}
                className="absolute text-2xl hover:scale-110 transition-transform z-10"
                style={{
                  left: `${gridX * 40 + 8}px`,
                  bottom: `${(20 - gridY) * 40 + 8}px`
                }}
                onClick={() => attackMob(mob)}
              >
                {mobNames[mob.type]}
              </button>
            );
          })}
        </Card>

        <div className="flex gap-4">
          <div className="flex gap-2 bg-black/80 p-3 border-4 border-black flex-1">
            {inventory.slice(0, 9).map((item, idx) => (
              <button
                key={idx}
                className={`w-16 h-16 ${item.isTool ? 'bg-gray-700' : blockColors[item.type as BlockType]} border-4 transition-all hover:scale-105 relative ${
                  selectedSlot === idx ? 'border-white' : 'border-gray-600'
                }`}
                onClick={() => setSelectedSlot(idx)}
                title={item.isTool ? toolNames[item.type as ToolType] : blockNames[item.type as BlockType]}
              >
                {item.isTool && (
                  <div className="text-xl absolute inset-0 flex items-center justify-center">
                    {item.type.includes('pickaxe') ? '⛏️' : item.type === 'sword' ? '⚔️' : '🪓'}
                  </div>
                )}
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
                    <Card key={idx} className={`${item.isTool ? 'bg-gray-700' : blockColors[item.type as BlockType]} p-4 border-4 border-black relative h-20`}>
                      <div className="text-white text-xs text-center drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {item.isTool ? (
                          <>
                            <div className="text-xl mb-1">
                              {item.type.includes('pickaxe') ? '⛏️' : item.type === 'sword' ? '⚔️' : '🪓'}
                            </div>
                            {toolNames[item.type as ToolType].split(' ')[0]}
                          </>
                        ) : (
                          blockNames[item.type as BlockType]
                        )}
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
                  {hasCraftingTable && (
                    <div className="text-white text-xs bg-green-600 p-2 border-2 border-black">
                      ✅ Верстак доступен
                    </div>
                  )}
                  <h3 className="text-white text-sm">Рецепты:</h3>
                  {recipes.map((recipe, idx) => (
                    <Card key={idx} className={`p-4 ${recipe.requiresCraftingTable && !hasCraftingTable ? 'bg-gray-600 opacity-50' : 'bg-[#DEB887]'} border-4 border-black`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {recipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-12 h-12 ${blockColors[ing.type as BlockType] || 'bg-gray-700'} border-2 border-black`} />
                              <span className="text-xs">x{ing.count}</span>
                            </div>
                          ))}
                          <Icon name="ArrowRight" size={20} />
                          <div className="flex items-center gap-2">
                            <div className={`w-12 h-12 ${blockColors[recipe.result as BlockType] || 'bg-gray-700'} border-2 border-black flex items-center justify-center`}>
                              {typeof recipe.result === 'string' && recipe.result.includes('pickaxe') && '⛏️'}
                              {typeof recipe.result === 'string' && recipe.result === 'sword' && '⚔️'}
                              {typeof recipe.result === 'string' && recipe.result.includes('axe') && !recipe.result.includes('pickaxe') && '🪓'}
                            </div>
                            <span className="text-xs">x{recipe.resultCount}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => craft(recipe)}
                          size="sm"
                          className="border-4 border-black"
                          disabled={recipe.requiresCraftingTable && !hasCraftingTable}
                        >
                          Создать
                        </Button>
                      </div>
                      {recipe.requiresCraftingTable && (
                        <div className="text-xs text-gray-700 mt-2">Требуется верстак</div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}

        <Card className="p-4 bg-black/80 border-4 border-black">
          <div className="text-white text-xs space-y-1">
            <p>🎮 WASD / Стрелки - движение | E - инвентарь | 1-9 - выбор слота</p>
            <p>🖱️ ЛКМ - добыть | Shift + ЛКМ - поставить | Клик по мобу - атака</p>
            <p>⛏️ Камера следует за игроком | 🏘️ Ищи деревни и шахты под землёй!</p>
            <p>⚔️ Враги атакуют ночью и наносят урон! Создай меч для защиты!</p>
          </div>
        </Card>
      </div>
    </div>
  );
}