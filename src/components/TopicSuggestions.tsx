import {
  Binary,
  GitBranch,
  Layers,
  Network,
  Workflow,
  Zap,
  TreeDeciduous,
  Hash,
} from "lucide-react";

const topics = [
  { label: "Arrays & Strings", icon: Binary, prompt: "Explain arrays and common array operations with examples" },
  { label: "Linked Lists", icon: GitBranch, prompt: "What is a linked list? Explain types with code examples" },
  { label: "Stacks & Queues", icon: Layers, prompt: "Explain stacks and queues with real-world use cases" },
  { label: "Trees & BST", icon: TreeDeciduous, prompt: "Explain binary trees and binary search trees with traversal examples" },
  { label: "Graphs", icon: Network, prompt: "Explain graph data structure, BFS and DFS with examples" },
  { label: "Hash Tables", icon: Hash, prompt: "How do hash tables work? Explain with collision handling" },
  { label: "Dynamic Programming", icon: Workflow, prompt: "Explain dynamic programming with a step-by-step example" },
  { label: "Sorting Algorithms", icon: Zap, prompt: "Compare all major sorting algorithms with their complexities" },
];

const TopicSuggestions = ({ onSelect }: { onSelect: (prompt: string) => void }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {topics.map((t) => (
      <button
        key={t.label}
        onClick={() => onSelect(t.prompt)}
        className="group flex flex-col items-center gap-2 rounded-xl bg-card border border-border p-4 text-center transition-all hover:border-primary/40 hover:glow-primary-sm"
      >
        <t.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {t.label}
        </span>
      </button>
    ))}
  </div>
);

export default TopicSuggestions;
