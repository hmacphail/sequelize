/*jshint camelcase: false*/
if (typeof require === 'function') {
  const buster    = require("buster")
      , Helpers   = require('../buster-helpers')
      , Sequelize = require('../../index')
      , dialect   = Helpers.getTestDialect()
}

buster.spec.expose()
buster.testRunner.timeout = 500

describe(Helpers.getTestDialectTeaser("BelongsTo"), function() {
  before(function(done) {
    Helpers.initTests({
      dialect: dialect,
      beforeComplete: function(sequelize) {
        this.sequelize = sequelize
      }.bind(this),
      onComplete: done
    })
  })

  describe('setAssociation', function() {
    it('can set the association with declared primary keys...', function(done) {
      var User = this.sequelize.define('UserXYZ', { user_id: {type: Sequelize.INTEGER, primaryKey: true }, username: Sequelize.STRING })
        , Task = this.sequelize.define('TaskXYZ', { task_id: {type: Sequelize.INTEGER, primaryKey: true }, title: Sequelize.STRING })

      Task.belongsTo(User, { foreignKey: 'user_id' })

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ user_id: 1, username: 'foo' }).success(function(user) {
          Task.create({ task_id: 1, title: 'task' }).success(function(task) {
            task.setUserXYZ(user).success(function() {
              task.getUserXYZ().success(function(user) {
                expect(user).not.toEqual(null)

                task.setUserXYZ(null).success(function() {
                  task.getUserXYZ().success(function(user) {
                    expect(user).toEqual(null)
                    done()
                  })
                })

              })
            })
          })
        })
      })
    })

    it('clears the association if null is passed', function(done) {
      var User = this.sequelize.define('UserXYZ', { username: Sequelize.STRING })
        , Task = this.sequelize.define('TaskXYZ', { title: Sequelize.STRING })

      Task.belongsTo(User)

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ username: 'foo' }).success(function(user) {
          Task.create({ title: 'task' }).success(function(task) {
            task.setUserXYZ(user).success(function() {
              task.getUserXYZ().success(function(user) {
                expect(user).not.toEqual(null)

                task.setUserXYZ(null).success(function() {
                  task.getUserXYZ().success(function(user) {
                    expect(user).toEqual(null)
                    done()
                  })
                })

              })
            })
          })
        })
      })
    })
  })

  describe("Foreign key constraints", function() {
    it("are not enabled by default", function(done) {
      var Task = this.sequelize.define('Task', { title: Sequelize.STRING })
        , User = this.sequelize.define('User', { username: Sequelize.STRING })

      Task.belongsTo(User)

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ username: 'foo' }).success(function(user) {
          Task.create({ title: 'task' }).success(function(task) {
            task.setUser(user).success(function() {
              user.destroy().success(function() {
                Task.findAll().success(function(tasks) {
                  expect(tasks.length).toEqual(1)
                  done()
                })
              })
            })
          })
        })
      })
    })

    it("can cascade deletes", function(done) {
      var Task = this.sequelize.define('Task', { title: Sequelize.STRING })
        , User = this.sequelize.define('User', { username: Sequelize.STRING })

      Task.belongsTo(User, {onDelete: 'cascade'})

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ username: 'foo' }).success(function(user) {
          Task.create({ title: 'task' }).success(function(task) {
            task.setUser(user).success(function() {
              user.destroy().success(function() {
                Task.findAll().success(function(tasks) {
                  expect(tasks.length).toEqual(0)
                  done()
                })
              })
            })
          })
        })
      })
    })

    it("can restrict deletes", function(done) {
      var Task = this.sequelize.define('Task', { title: Sequelize.STRING })
        , User = this.sequelize.define('User', { username: Sequelize.STRING })

      Task.belongsTo(User, {onDelete: 'restrict'})

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ username: 'foo' }).success(function(user) {
          Task.create({ title: 'task' }).success(function(task) {
            task.setUser(user).success(function() {
              user.destroy().error(function() {
                // Should fail due to FK restriction
                Task.findAll().success(function(tasks) {
                  expect(tasks.length).toEqual(1)
                  done()
                })
              })
            })
          })
        })
      })
    })

    it("can cascade updates", function(done) {
      var Task = this.sequelize.define('Task', { title: Sequelize.STRING })
        , User = this.sequelize.define('User', { username: Sequelize.STRING })

      Task.belongsTo(User, {onUpdate: 'cascade'})

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ username: 'foo' }).success(function(user) {
          Task.create({ title: 'task' }).success(function(task) {
            task.setUser(user).success(function() {

              // Changing the id of a DAO requires a little dance since
              // the `UPDATE` query generated by `save()` uses `id` in the
              // `WHERE` clause

              var tableName = user.QueryInterface.QueryGenerator.addSchema(user.__factory)
              user.QueryInterface.update(user, tableName, {id: 999}, user.id)
              .success(function() {
                Task.findAll().success(function(tasks) {
                  expect(tasks.length).toEqual(1)
                  expect(tasks[0].UserId).toEqual(999)
                  done()
                })
              })
            })
          })
        })
      })
    })

    it("can restrict updates", function(done) {
      var Task = this.sequelize.define('Task', { title: Sequelize.STRING })
        , User = this.sequelize.define('User', { username: Sequelize.STRING })

      Task.belongsTo(User, {onUpdate: 'restrict'})

      this.sequelize.sync({ force: true }).success(function() {
        User.create({ username: 'foo' }).success(function(user) {
          Task.create({ title: 'task' }).success(function(task) {
            task.setUser(user).success(function() {

              // Changing the id of a DAO requires a little dance since
              // the `UPDATE` query generated by `save()` uses `id` in the
              // `WHERE` clause

              var tableName = user.QueryInterface.QueryGenerator.addSchema(user.__factory)
              user.QueryInterface.update(user, tableName, {id: 999}, user.id)
              .error(function() {
                // Should fail due to FK restriction
                Task.findAll().success(function(tasks) {
                  expect(tasks.length).toEqual(1)
                  done()
                })
              })
            })
          })
        })
      })
    })

  })

  describe("Association options", function() {
    it('can specify data type for autogenerated relational keys', function(done) {
      var User = this.sequelize.define('UserXYZ', { username: Sequelize.STRING })
        , dataTypes = [Sequelize.INTEGER, Sequelize.BIGINT, Sequelize.STRING]
        , self = this

      dataTypes.forEach(function(dataType) {
        var tableName = 'TaskXYZ_' + dataType.toString()
          , Task = self.sequelize.define(tableName, { title: Sequelize.STRING })

        Task.belongsTo(User, { foreignKey: 'userId', keyType: dataType })

        self.sequelize.sync({ force: true }).success(function() {
          expect(Task.rawAttributes.userId.type.toString())
            .toEqual(dataType.toString())

          dataTypes.splice(dataTypes.indexOf(dataType), 1)
          if (!dataTypes.length) {
            done()
          }
        })
      })
    })
  })

})
