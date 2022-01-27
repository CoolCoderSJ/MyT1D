import * as FileSystem from 'expo-file-system';
const { StorageAccessFramework } = FileSystem;

export default class Database {
  constructor (database) {
    this.db = database + ".json"
  }

  async get (key) {
    const filepath = FileSystem.documentDirectory + "db/" + this.db
    try {
      text = await FileSystem.readAsStringAsync(filepath)
    }

    catch {
      try {
        dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + "db")
        console.log(dir)
      }
      catch {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "db")
      }

      await FileSystem.writeAsStringAsync(filepath, "{}")
      text = await FileSystem.readAsStringAsync(filepath)
    }

    return JSON.parse(text)[key]
  }

  async remove (key) {
    const filepath = FileSystem.documentDirectory + "db/" + this.db
    try {
      text = await FileSystem.readAsStringAsync(filepath)
    }

    catch {
      try {
        dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + "db")
        console.log(dir)
      }
      catch {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "db")
      }

      await FileSystem.writeAsStringAsync(filepath, "{}")
      text = await FileSystem.readAsStringAsync(filepath)
    }
    let data = JSON.parse(text)
    delete data[key]
    await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data))
  }

  async set (key, data) {
    const filepath = FileSystem.documentDirectory + "db/" + this.db
    try {
      text = await FileSystem.readAsStringAsync(filepath)
    }

    catch {
      try {
        dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + "db")
        console.log(dir)
      }
      catch {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "db")
      }

      await FileSystem.writeAsStringAsync(filepath, "{}")
      text = await FileSystem.readAsStringAsync(filepath)
    }

    result = JSON.parse(text)
    result[key] = data

    await FileSystem.writeAsStringAsync(filepath, JSON.stringify(result))
    return result
  }

  async clear () {
    const filepath = FileSystem.documentDirectory + "db/" + this.db
    try {
      text = await FileSystem.readAsStringAsync(filepath)
    }

    catch {
      try {
        dir = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + "db")
        console.log(dir)
      }
      catch {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "db")
      }
    }

    await FileSystem.writeAsStringAsync(filepath, "{}")
  }

}
