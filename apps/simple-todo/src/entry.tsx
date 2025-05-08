// import { TamaguiPreview } from "@core/components/TamaguiPreview"
import { Check, Plus, Trash2 } from "@tamagui/lucide-icons"
import { useState } from "react"
import {
  Button,
  Input,
  InputFrame,
  ListItem,
  ScrollView,
  type SizeTokens,
  Text,
  TextArea,
  XStack,
  YStack,
} from "tamagui"

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

function InputDemo(props: { size: SizeTokens }) {
  return (
    <XStack alignItems="center" space="$2">
      <Input flex={1} size={props.size} placeholder={`Size ${props.size}...`} />
      <Button size={props.size}>Go</Button>
    </XStack>
  )
}

export function Main() {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "1",
      text: "Buy groceries",
      completed: false,
    },
    {
      id: "2",
      text: "Finish project",
      completed: true,
    },
  ])
  const [newTodo, setNewTodo] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: newTodo.trim(),
          completed: false,
        },
      ])
      setNewTodo("")
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const completedCount = todos.filter((todo) => todo.completed).length

  return (
    <YStack flex={1} p="$4" gap="$4" backgroundColor="$background">
      <YStack gap="$3" animation="bouncy">
        <Text fontSize="$12" fontWeight="900" textAlign="center" color="$color" letterSpacing={-1} animation="bouncy">
          Todo List HI
        </Text>
        <XStack justifyContent="center" gap="$3" opacity={0.7}>
          <Text fontSize="$4" color="$color" fontWeight="500">
            {todos.length} {todos.length === 1 ? "task" : "tasks"}
          </Text>
          {todos.length > 0 && (
            <>
              <Text fontSize="$4" color="$color" opacity={0.3}>
                •
              </Text>
              <Text fontSize="$4" color="$color" fontWeight="500">
                {completedCount} completed
              </Text>
            </>
          )}
        </XStack>
      </YStack>
      <XStack
        gap="$2"
        animation="bouncy"
        scale={isInputFocused ? 1.02 : 1}
        opacity={isInputFocused ? 1 : 0.9}
        padding="$1"
      >
        <Input
          flex={1}
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a new todo..."
          onSubmitEditing={addTodo}
          style={{ borderWidth: 1, borderColor: "red", color: "#0000ff" }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        <Button
          onPress={addTodo}
          theme="active"
          size="$4"
          circular
          icon={<Plus size={20} />}
          animation="bouncy"
          scale={newTodo.trim() ? 1.1 : 1}
          opacity={newTodo.trim() ? 1 : 0.7}
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={newTodo.trim() ? 0.2 : 0}
          shadowRadius={8}
          padding="$3"
        />
      </XStack>

      <ScrollView>
        <YStack gap="$3" animation="quicker" padding="$1">
          {todos.map((todo, index) => (
            <ListItem
              key={todo.id}
              pressTheme
              onPress={() => toggleTodo(todo.id)}
              animation="quick"
              enterStyle={{ scale: 0.9, opacity: 0, y: 20 }}
              exitStyle={{ scale: 0.9, opacity: 0, y: -20 }}
              backgroundColor="$background"
              borderWidth={1}
              borderColor={todo.completed ? "$borderColor" : "$color"}
              borderRadius="$6"
              padding="$4"
              marginVertical="$1"
              opacity={todo.completed ? 0.7 : 1}
              scale={todo.completed ? 0.98 : 1}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.1}
              shadowRadius={4}
              icon={
                <Button
                  circular
                  size="$4"
                  theme={todo.completed ? "active" : "gray"}
                  onPress={() => toggleTodo(todo.id)}
                  animation="bouncy"
                  scale={todo.completed ? 1.1 : 1}
                  borderWidth={1}
                  borderColor={todo.completed ? "$color" : "$borderColor"}
                  padding="$2"
                >
                  {todo.completed && <Check size={18} />}
                </Button>
              }
              title={
                <Text
                  fontSize="$5"
                  textDecorationLine={todo.completed ? "line-through" : "none"}
                  opacity={todo.completed ? 0.5 : 1}
                  color="$color"
                  fontWeight={todo.completed ? "normal" : "600"}
                  letterSpacing={-0.5}
                >
                  {todo.text}
                </Text>
              }
              subTitle={
                <Button
                  circular
                  size="$4"
                  theme="red"
                  onPress={() => deleteTodo(todo.id)}
                  animation="bouncy"
                  scale={0.9}
                  opacity={0.8}
                  borderWidth={1}
                  borderColor="$borderColor"
                  padding="$2"
                >
                  <Trash2 size={18} />
                </Button>
              }
            />
          ))}
        </YStack>
      </ScrollView>

      {/* <TamaguiPreview /> */}
    </YStack>
  )
}
