
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Home } from 'lucide-react';

const OutlinerEditor = ({ content, onChange }) => {
  const [data, setData] = useState(() => {
    try {
      return content ? JSON.parse(content) : {
        id: 'root',
        content: '',
        children: []
      };
    } catch {
      return {
        id: 'root',
        content: '',
        children: []
      };
    }
  });

  const [expandedNodes, setExpandedNodes] = useState(new Set(['1', '1-1', '2']));
  const [currentView, setCurrentView] = useState(['root']);
  const [editingNode, setEditingNode] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);

  const inputRefs = useRef({});

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(JSON.stringify(data));
    }
  }, [data, onChange]);

  // Get current node being viewed
  const getCurrentNode = () => {
    let current = data;
    for (let i = 1; i < currentView.length; i++) {
      current = current.children.find(child => child.id === currentView[i]);
    }
    return current;
  };

  // Get breadcrumb path
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    let current = data;
    
    for (let i = 0; i < currentView.length; i++) {
      if (i === 0) {
        breadcrumbs.push({ id: 'root', content: 'Home' });
      } else {
        current = current.children.find(child => child.id === currentView[i]);
        if (current) {
          breadcrumbs.push({ id: current.id, content: current.content });
        }
      }
    }
    return breadcrumbs;
  };

  // Toggle node expansion
  const toggleExpanded = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Zoom into a node
  const zoomInto = (nodeId) => {
    // Build the full path to this node
    const findNodePath = (searchNode, targetId, currentPath = ['root']) => {
      if (searchNode.id === targetId) {
        return currentPath;
      }
      
      for (const child of searchNode.children) {
        const childPath = [...currentPath, child.id];
        if (child.id === targetId) {
          return childPath;
        }
        
        const foundPath = findNodePath(child, targetId, childPath);
        if (foundPath) {
          return foundPath;
        }
      }
      
      return null;
    };
    
    const fullPath = findNodePath(data, nodeId);
    if (fullPath) {
      setCurrentView(fullPath);
    }
  };

  // Navigate breadcrumb
  const navigateTo = (index) => {
    setCurrentView(currentView.slice(0, index + 1));
  };

  // Update node content
  const updateNodeContent = (nodeId, newContent) => {
    const updateNode = (node) => {
      if (node.id === nodeId) {
        return { ...node, content: newContent };
      }
      return {
        ...node,
        children: node.children.map(updateNode)
      };
    };
    setData(updateNode(data));
  };

  // Add new node
  const addNode = (parentId, afterId = null) => {
    const newId = Date.now().toString();
    const newNode = { id: newId, content: '', children: [] };

    const addToNode = (node) => {
      if (node.id === parentId) {
        const newChildren = [...node.children];
        if (afterId) {
          const index = newChildren.findIndex(child => child.id === afterId);
          newChildren.splice(index + 1, 0, newNode);
        } else {
          newChildren.push(newNode);
        }
        return { ...node, children: newChildren };
      }
      return {
        ...node,
        children: node.children.map(addToNode)
      };
    };

    setData(addToNode(data));
    setEditingNode(newId);
    setFocusedNode(newId);
    
    // Ensure parent is expanded
    setExpandedNodes(prev => new Set([...prev, parentId]));
    
    return newId;
  };

  // Indent node (move as child of previous sibling)
  const indentNode = (nodeId, currentParentId) => {
    const moveNode = (node) => {
      if (node.id === currentParentId) {
        const nodeIndex = node.children.findIndex(child => child.id === nodeId);
        if (nodeIndex > 0) {
          const nodeToMove = node.children[nodeIndex];
          const newParent = node.children[nodeIndex - 1];
          
          // Remove from current parent
          const newChildren = [...node.children];
          newChildren.splice(nodeIndex, 1);
          
          // Add to previous sibling
          const updatedPrevSibling = {
            ...newParent,
            children: [...newParent.children, nodeToMove]
          };
          newChildren[nodeIndex - 1] = updatedPrevSibling;
          
          // Expand the new parent to show the moved node
          setExpandedNodes(prev => new Set([...prev, newParent.id]));
          
          return { ...node, children: newChildren };
        }
      }
      return {
        ...node,
        children: node.children.map(moveNode)
      };
    };
    
    setData(moveNode(data));
  };

  // Unindent node (move to parent's parent)
  const unindentNode = (nodeId, currentParentId) => {
    const moveNode = (node, grandParentId = null) => {
      // Find if this node contains the parent
      const parentIndex = node.children.findIndex(child => child.id === currentParentId);
      if (parentIndex >= 0) {
        const parent = node.children[parentIndex];
        const nodeIndex = parent.children.findIndex(child => child.id === nodeId);
        
        if (nodeIndex >= 0) {
          const nodeToMove = parent.children[nodeIndex];
          
          // Remove from current parent
          const updatedParent = {
            ...parent,
            children: parent.children.filter(child => child.id !== nodeId)
          };
          
          // Add to grandparent after the parent
          const newChildren = [...node.children];
          newChildren[parentIndex] = updatedParent;
          newChildren.splice(parentIndex + 1, 0, nodeToMove);
          
          return { ...node, children: newChildren };
        }
      }
      
      return {
        ...node,
        children: node.children.map(child => moveNode(child, node.id))
      };
    };
    
    setData(moveNode(data));
  };

  // Handle key events
  const handleKeyDown = (e, nodeId, parentId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNode(parentId, nodeId);
      // Focus will be set in the addNode function
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: unindent
        unindentNode(nodeId, parentId);
        // Keep focus on current node after unindent
        setTimeout(() => {
          if (inputRefs.current[nodeId]) {
            inputRefs.current[nodeId].focus();
          }
        }, 0);
      } else {
        // Tab: indent
        indentNode(nodeId, parentId);
        // Keep focus on current node after indent
        setTimeout(() => {
          if (inputRefs.current[nodeId]) {
            inputRefs.current[nodeId].focus();
          }
        }, 0);
      }
    } else if (e.key === 'Escape') {
      setEditingNode(null);
      setFocusedNode(null);
      // Navigate back to root view
      setCurrentView(['root']);
    }
  };

  // Focus input when editing starts or changes
  useEffect(() => {
    if (editingNode && inputRefs.current[editingNode]) {
      const input = inputRefs.current[editingNode];
      input.focus();
      // Set cursor to end of text
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [editingNode, data]); // Also trigger when data changes

  // Render a single node
  const renderNode = (node, parentId = null, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isEditing = editingNode === node.id;

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center group hover:bg-gray-50 rounded-sm transition-colors"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          {/* Toggle button */}
          <button
            onClick={() => toggleExpanded(node.id)}
            className={`p-1 rounded hover:bg-gray-200 transition-colors ${
              hasChildren ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ width: '20px', height: '20px' }}
          >
            {hasChildren && (
              isExpanded ? 
                <ChevronDown size={12} /> : 
                <ChevronRight size={12} />
            )}
          </button>

          {/* Bullet point */}
          <button
            onClick={() => hasChildren && zoomInto(node.id)}
            className={`flex items-center justify-center w-4 h-4 mr-2 rounded-full transition-colors ${
              hasChildren 
                ? 'hover:bg-blue-100 cursor-pointer' 
                : 'cursor-default'
            }`}
            title={hasChildren ? "Click to zoom in" : ""}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
              hasChildren 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-400'
            }`}></div>
          </button>

          {/* Content */}
          <div className="flex-1 py-1">
            {isEditing ? (
              <input
                ref={el => inputRefs.current[node.id] = el}
                type="text"
                value={node.content}
                onChange={(e) => updateNodeContent(node.id, e.target.value)}
                onBlur={(e) => {
                  // Only blur if not immediately focusing another input
                  setTimeout(() => {
                    if (!document.activeElement || !document.activeElement.matches('input[type="text"]')) {
                      setEditingNode(null);
                    }
                  }, 0);
                }}
                onKeyDown={(e) => handleKeyDown(e, node.id, parentId)}
                className="w-full bg-transparent border-none outline-none text-gray-900"
                placeholder="Type something..."
                autoFocus
              />
            ) : (
              <div
                onClick={() => {
                  setEditingNode(node.id);
                  setFocusedNode(node.id);
                }}
                className="cursor-text text-gray-900 min-h-[20px] py-0.5"
              >
                {node.content || (
                  <span className="text-gray-400 italic">Click to edit</span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <button
              onClick={() => addNode(node.id)}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title="Add child"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => 
              renderNode(child, node.id, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const currentNode = getCurrentNode();
  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="w-full bg-white h-full flex flex-col">
      {/* Header with breadcrumbs */}
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              {index > 0 && <ChevronRight size={14} className="text-gray-400" />}
              <button
                onClick={() => navigateTo(index)}
                className={`px-2 py-1 rounded hover:bg-white hover:text-blue-600 transition-colors ${
                  index === breadcrumbs.length - 1 
                    ? 'text-gray-900 font-medium bg-white shadow-sm' 
                    : 'text-gray-600 hover:shadow-sm'
                }`}
              >
                {index === 0 ? (
                  <div className="flex items-center space-x-1">
                    <Home size={14} />
                    <span>Home</span>
                  </div>
                ) : (
                  crumb.content || 'Untitled'
                )}
              </button>
            </React.Fragment>
          ))}
          
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {currentNode && (
          <div className="space-y-1">
            {currentNode.children.length === 0 ? (
              <div className="text-gray-500 italic py-4 text-center text-sm">
                {currentView.length > 1 ? (
                  <div>
                    <div className="mb-2">This item has no sub-items yet.</div>
                    <div className="text-xs">Click the + button below to add the first sub-item.</div>
                  </div>
                ) : (
                  "No items yet. Click the + button to add your first item."
                )}
              </div>
            ) : (
              currentNode.children.map(child => 
                renderNode(child, currentNode.id)
              )
            )}
            
            {/* Add root level item button */}
            <div className="pt-2">
              <button
                onClick={() => addNode(currentNode.id)}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded hover:bg-gray-50 text-sm"
              >
                <Plus size={14} />
                <span>Add item</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutlinerEditor;
