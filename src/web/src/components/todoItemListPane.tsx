import { CommandBar, DetailsList, DetailsListLayoutMode, ICommandBarItemProps, IStackStyles, Selection, Stack, IIconProps, SearchBox, Text, IGroup, IColumn, MarqueeSelection, FontIcon, IObjectWithKey, CheckboxVisibility, IDetailsGroupRenderProps, getTheme } from '@fluentui/react';
import React, { ReactElement, useEffect, useState, FormEvent, FC } from 'react';
import { useNavigate } from 'react-router';
import { GroupStates, TodoItem, TodoItemState, TodoList } from '../models';
import { stackItemPadding } from '../ux/styles';

interface TodoItemListPaneProps {
    groupStates:GroupStates
    list?: TodoList
    items?: TodoItem[]
    selectedItem?: TodoItem;
    onCreated: (item: TodoItem) => void
    onDelete: (item: TodoItem) => void
    onComplete: (item: TodoItem) => void
    onSelect: (item?: TodoItem) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onGroupChange:(group?:any)=>void
}

interface TodoDisplayItem extends IObjectWithKey {
    id?: string
    listId: string
    name: string
    state: TodoItemState
    description?: string
    dueDate: Date | string
    completedDate: Date | string
    data: TodoItem
    createdDate?: Date
    updatedDate?: Date
}

const addIconProps: IIconProps = {
    iconName: 'Add',
    styles: {
        root: {
        }
    }
};

const createListItems = (items: TodoItem[]): TodoDisplayItem[] => {
    return items.map(item => ({
        ...item,
        key: item.id,
        dueDate: item.dueDate ? new Date(item.dueDate).toDateString() : 'None',
        completedDate: item.completedDate ? new Date(item.completedDate).toDateString() : 'N/A',
        data: item
    }));
};

const stackStyles: IStackStyles = {
    root: {
        alignItems: 'center'
    }
}

const TodoItemListPane: FC<TodoItemListPaneProps> = (props: TodoItemListPaneProps): ReactElement => {
    const theme = getTheme();
    const navigate = useNavigate();
    const [newItemName, setNewItemName] = useState('');
    const [items, setItems] = useState(createListItems(props.items || []));
    const [selectedItems, setSelectedItems] = useState<TodoItem[]>([]);
    const [groupStates,setGroupStates] = useState(props.groupStates)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const selection = new Selection({
        onSelectionChanged: async () => {
            const currentRes = localStorage.getItem("groupStates")
            const currentStates = currentRes?JSON.parse(currentRes):undefined
            setGroupStates(currentStates)
            const selectedItems = selection.getSelection().map(item => (item as TodoDisplayItem).data);
            setSelectedItems(selectedItems);
        }
    });

    // Handle items changed
    useEffect(() => {
        const sortedItems = (props.items || []).sort((a, b) => {
            if (a.state === b.state) {
                return a.name < b.name ? -1 : 1;
            }

            return a.state < b.state ? -1 : 1;
        })
        setItems(createListItems(sortedItems || []));
    }, [props.items]);

    // Handle selected item changed
    useEffect(() => {
        if (items.length > 0 && props.selectedItem?.id) {
            selection.setKeySelected(props.selectedItem.id, true, true);
        }
    }, [items.length, props.selectedItem, selection])

    useEffect(() => {
        setGroupStates(props.groupStates)
    }, [props.groupStates])

    const groups: IGroup[] = [
        {
            key: TodoItemState.Todo,
            name: 'Todo',
            count: items.filter(i => i.state === TodoItemState.Todo).length,
            startIndex: items.findIndex(i => i.state === TodoItemState.Todo),
            isCollapsed:groupStates.todo
        },
        {
            key: TodoItemState.InProgress,
            name: 'In Progress',
            count: items.filter(i => i.state === TodoItemState.InProgress).length,
            startIndex: items.findIndex(i => i.state === TodoItemState.InProgress),
            isCollapsed:groupStates.inprogress
        },
        {
            key: TodoItemState.Done,
            name: 'Done',
            count: items.filter(i => i.state === TodoItemState.Done).length,
            startIndex: items.findIndex(i => i.state === TodoItemState.Done),
            isCollapsed:groupStates.done
        },
    ]

    const onFormSubmit = async (evt: FormEvent<HTMLFormElement>) => {
        evt.preventDefault();

        if (newItemName && props.onCreated) {
            const item: TodoItem = {
                name: newItemName,
                listId: props.list?.id || '',
                state: TodoItemState.Todo,
            }
            props.onCreated(item);
            setNewItemName('');
        }
    }

    const onNewItemChanged = (evt?: FormEvent<HTMLInputElement>, value?: string) => {
        setNewItemName(value || '');
    }

    const selectItem = (item: TodoDisplayItem) => {
        navigate(`/lists/${item.data.listId}/items/${item.data.id}`);
    }

    const completeItems = async () => {
        const tasks = selectedItems.map(item => props.onComplete(item));
        Promise.all(tasks);
    }

    const deleteItems = async () => {
        const tasks = selectedItems.map(item => props.onDelete(item));
        Promise.all(tasks);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const changeGroupState = (group:any) => {
        props.onGroupChange(group)
    }

    const columns: IColumn[] = [
        { key: 'name', name: 'Name', fieldName: 'name', minWidth: 100 },
        { key: 'dueDate', name: 'Due', fieldName: 'dueDate', minWidth: 100 },
        { key: 'completedDate', name: 'Completed', fieldName: 'completedDate', minWidth: 100 },
    ];

    const commandItems: ICommandBarItemProps[] = [
        { key: 'markComplete', text: 'Mark Complete', iconProps: { iconName: 'Completed' }, onClick: () => { completeItems() } },
        { key: 'delete', text: 'Delete', iconProps: { iconName: 'Delete' }, onClick: () => { deleteItems() } },
    ];

    const groupRenderProps: IDetailsGroupRenderProps = {
        headerProps: {
            styles: {
                groupHeaderContainer: {
                    backgroundColor: theme.palette.neutralPrimary
                }
            },
            onToggleCollapse: (group: IGroup) => {
                console.log(group)
                changeGroupState(group)
                const currentRes = localStorage.getItem("groupStates")
                const currentStates = currentRes?JSON.parse(currentRes):null
                setGroupStates(currentStates)
            }
        },
        onToggleCollapseAll:(isAllCollapsed)=>{
            localStorage.setItem("groupStates",JSON.stringify({todo:isAllCollapsed,inprogress:isAllCollapsed,done:isAllCollapsed}))
        }
    }

    const renderItemColumn = (item: TodoDisplayItem, index?: number, column?: IColumn) => {
        const fieldContent = item[column?.fieldName as keyof TodoDisplayItem] as string;

        switch (column?.key) {
            case "name":
                return (
                    <>
                        <Text variant="small" block>{item.name}</Text>
                        {item.description &&
                            <>
                                <FontIcon iconName="QuickNote" style={{ padding: "5px 5px 5px 0" }} />
                                <Text variant="smallPlus">{item.description}</Text>
                            </>
                        }
                    </>
                );
            default:
                return (<Text variant="small">{fieldContent}</Text>)
        }
    }

    return (
        <Stack>
            <Stack.Item>
                <form onSubmit={onFormSubmit}>
                    <Stack horizontal styles={stackStyles}>
                        <Stack.Item grow={1}>
                            <SearchBox value={newItemName} placeholder="Add an item" iconProps={addIconProps} onChange={onNewItemChanged} />
                        </Stack.Item>
                        <Stack.Item>
                            <CommandBar
                                items={commandItems}
                                ariaLabel="Todo actions" />
                        </Stack.Item>
                    </Stack>
                </form>
            </Stack.Item>
            {items.length > 0 &&
                <Stack.Item>
                    <MarqueeSelection selection={selection}>
                        <DetailsList
                            items={items}
                            groups={groups}
                            columns={columns}
                            groupProps={groupRenderProps}
                            setKey="id"
                            onRenderItemColumn={renderItemColumn}
                            selection={selection}
                            layoutMode={DetailsListLayoutMode.justified}
                            selectionPreservedOnEmptyClick={true}
                            ariaLabelForSelectionColumn="Toggle selection"
                            ariaLabelForSelectAllCheckbox="Toggle selection for all items"
                            checkButtonAriaLabel="select row"
                            checkboxVisibility={CheckboxVisibility.always}
                            onActiveItemChanged={selectItem} />
                    </MarqueeSelection>
                </Stack.Item>
            }
            {items.length === 0 &&
                <Stack.Item align="center" tokens={stackItemPadding}>
                    <Text>This list is empty.</Text>
                </Stack.Item>
            }
        </Stack>
    );
};

export default TodoItemListPane;